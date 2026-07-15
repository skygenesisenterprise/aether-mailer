import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "../../lib/api/errors.ts";
import {
  authApi,
  clearStoredTokens,
  configureAccessTokenProvider,
  getStoredAccessToken,
  getStoredUser,
  refreshAccessToken,
  setStoredAccessToken,
  storeUser,
} from "../../lib/api/auth.ts";
import { apiRequest } from "../../lib/api/client.ts";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearStoredTokens();
  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      return null;
    },
  });
});

test("auth bootstrap refreshes once for concurrent requests", async () => {
  let refreshCalls = 0;

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(
        JSON.stringify({
          data: {
            accessToken: "access-1",
            expiresIn: 900,
            user: {
              id: "user-1",
              email: "alice@example.com",
              displayName: "Alice",
              status: "active",
              createdAt: "2026-06-27T00:00:00Z",
              updatedAt: "2026-06-27T00:00:00Z",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Error(`unexpected request ${url}`);
  };

  const [first, second] = await Promise.all([authApi.bootstrap(), authApi.bootstrap()]);

  assert.equal(refreshCalls, 1);
  assert.equal(first?.id, "user-1");
  assert.equal(second?.id, "user-1");
  assert.equal(getStoredAccessToken(), "access-1");
});

test("auth bootstrap without session settles unauthenticated after one refresh attempt", async () => {
  let refreshCalls = 0;

  globalThis.fetch = async (input) => {
    const url = String(input);

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "missing cookie" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`unexpected request ${url}`);
  };

  const user = await authApi.bootstrap();

  assert.equal(refreshCalls, 1);
  assert.equal(user, null);
  assert.equal(getStoredAccessToken(), null);
  assert.equal(getStoredUser(), null);
});

test("invalid login returns the original 401 without triggering refresh", async () => {
  let loginCalls = 0;
  let refreshCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    if (url.endsWith("/auth/login")) {
      loginCalls += 1;
      assert.equal((init?.headers as Headers).get("authorization"), null);
      return new Response(JSON.stringify({ error: { code: "INVALID_CREDENTIALS", message: "bad credentials" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "unexpected" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`unexpected request ${url}`);
  };

  await assert.rejects(
    () => authApi.login({ email: "alice@example.com", password: "wrong-password" }),
    (error: unknown) => error instanceof ApiError && error.status === 401 && error.code === "INVALID_CREDENTIALS"
  );

  assert.equal(loginCalls, 1);
  assert.equal(refreshCalls, 0);
});

test("successful login stores token and user without triggering refresh", async () => {
  let loginCalls = 0;
  let refreshCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    if (url.endsWith("/auth/login")) {
      loginCalls += 1;
      assert.equal((init?.headers as Headers).get("authorization"), null);
      return new Response(
        JSON.stringify({
          data: {
            accessToken: "access-login",
            expiresIn: 900,
            user: {
              id: "user-1",
              email: "alice@example.com",
              displayName: "Alice",
              status: "active",
              createdAt: "2026-06-27T00:00:00Z",
              updatedAt: "2026-06-27T00:00:00Z",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "unexpected" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`unexpected request ${url}`);
  };

  const response = await authApi.login({ email: "alice@example.com", password: "correct-password" });

  assert.equal(loginCalls, 1);
  assert.equal(refreshCalls, 0);
  assert.equal(response.accessToken, "access-login");
  assert.equal(getStoredAccessToken(), "access-login");
  assert.equal(getStoredUser()?.id, "user-1");
});

test("apiRequest retries once after a 401 with a shared refresh promise", async () => {
  let protectedCalls = 0;
  let refreshCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response(
        JSON.stringify({
          data: {
            accessToken: "access-2",
            expiresIn: 900,
            user: {
              id: "user-1",
              email: "alice@example.com",
              displayName: "Alice",
              status: "active",
              createdAt: "2026-06-27T00:00:00Z",
              updatedAt: "2026-06-27T00:00:00Z",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    protectedCalls += 1;

    if (protectedCalls <= 2) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    assert.equal((init?.headers as Headers).get("authorization"), "Bearer access-2");
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      return authApi.bootstrap().then(() => getStoredAccessToken());
    },
  });

  const response = await apiRequest<{ ok: boolean }>("/me");

  assert.deepEqual(response, { ok: true });
  assert.equal(refreshCalls, 1);
  assert.equal(protectedCalls, 2);
});

test("concurrent protected requests share one refresh request", async () => {
  let protectedCalls = 0;
  let refreshCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response(
        JSON.stringify({
          data: {
            accessToken: "access-2",
            expiresIn: 900,
            user: {
              id: "user-1",
              email: "alice@example.com",
              displayName: "Alice",
              status: "active",
              createdAt: "2026-06-27T00:00:00Z",
              updatedAt: "2026-06-27T00:00:00Z",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    protectedCalls += 1;

    if (protectedCalls <= 2) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    assert.equal((init?.headers as Headers).get("authorization"), "Bearer access-2");
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      return authApi.bootstrap().then(() => getStoredAccessToken());
    },
  });

  const [first, second] = await Promise.all([apiRequest<{ ok: boolean }>("/me"), apiRequest<{ ok: boolean }>("/me")]);

  assert.deepEqual(first, { ok: true });
  assert.deepEqual(second, { ok: true });
  assert.equal(refreshCalls, 1);
  assert.equal(protectedCalls, 4);
});

test("failed refresh preserves the client session and returns the original 401 flow without loops", async () => {
  let protectedCalls = 0;
  let refreshCalls = 0;

  setStoredAccessToken("stale-access");
  storeUser({
    id: "user-1",
    email: "alice@example.com",
    displayName: "Alice",
    status: "active",
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
  });

  globalThis.fetch = async (input) => {
    const url = String(input);

    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "missing cookie" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    protectedCalls += 1;
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  };

  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      return refreshAccessToken();
    },
  });

  await assert.rejects(
    () => apiRequest("/me"),
    (error: unknown) => error instanceof ApiError && error.status === 401 && error.code === "UNAUTHORIZED"
  );

  assert.equal(refreshCalls, 1);
  assert.equal(protectedCalls, 1);
  assert.equal(getStoredAccessToken(), "stale-access");
  assert.equal(getStoredUser()?.id, "user-1");
});
