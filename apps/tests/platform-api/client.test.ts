import test from "node:test";
import assert from "node:assert/strict";

import { clearStoredTokens, configureAccessTokenProvider, getStoredAccessToken, setStoredAccessToken } from "../../lib/api/auth.ts";
import { apiListRequest, apiRequest } from "../../lib/api/client.ts";
import { ApiError } from "../../lib/api/errors.ts";
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearStoredTokens();
  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
  });
});

test("apiRequest sends bearer token and idempotency key", async () => {
  configureAccessTokenProvider({
    async getAccessToken() {
      return "test-token";
    },
  });

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "/api/v1/me");
    assert.equal(init?.headers instanceof Headers, true);
    const headers = init?.headers as Headers;
    assert.equal(headers.get("authorization"), "Bearer test-token");
    assert.equal(headers.get("idempotency-key"), "idem-123");

    return new Response(JSON.stringify({ data: { ok: true }, meta: { requestId: "req-1" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await apiRequest<{ ok: boolean }>("/me", {
    idempotencyKey: "idem-123",
  });

  assert.deepEqual(response, { ok: true });
});

test("apiListRequest unwraps list envelopes and meta", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [{ id: "ws-1" }],
        meta: { requestId: "req-1", nextCursor: "next-1", hasMore: true },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  const response = await apiListRequest<{ id: string }>("/workspaces");

  assert.deepEqual(response.data, [{ id: "ws-1" }]);
  assert.equal(response.meta.requestId, "req-1");
  assert.equal(response.meta.nextCursor, "next-1");
  assert.equal(response.meta.hasMore, true);
});

test("apiRequest normalizes HTTP errors", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: { code: "WORKSPACE_NOT_FOUND", message: "missing" },
        meta: { requestId: "req-404" },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );

  await assert.rejects(
    () => apiRequest("/workspaces/ws-missing"),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 404 &&
      error.code === "WORKSPACE_NOT_FOUND" &&
      error.requestId === "req-404"
  );
});

test("apiRequest skips auth header and refresh when configured", async () => {
  let getAccessTokenCalls = 0;
  let refreshCalls = 0;

  configureAccessTokenProvider({
    async getAccessToken() {
      getAccessTokenCalls += 1;
      return "should-not-be-used";
    },
    async refreshAccessToken() {
      refreshCalls += 1;
      return "unexpected-refresh";
    },
  });

  globalThis.fetch = async (_, init) => {
    const headers = init?.headers as Headers;
    assert.equal(headers.get("authorization"), null);

    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "nope" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  };

  await assert.rejects(() =>
    apiRequest("/auth/login", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
    })
  );

  assert.equal(getAccessTokenCalls, 0);
  assert.equal(refreshCalls, 0);
});

test("apiRequest retries a protected request once after refresh", async () => {
  let refreshCalls = 0;
  let protectedCalls = 0;

  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      refreshCalls += 1;
      setStoredAccessToken("access-2");
      return "access-2";
    },
  });

  setStoredAccessToken("access-1");

  globalThis.fetch = async (_, init) => {
    protectedCalls += 1;
    const headers = init?.headers as Headers;

    if (protectedCalls === 1) {
      assert.equal(headers.get("authorization"), "Bearer access-1");
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "expired" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    assert.equal(headers.get("authorization"), "Bearer access-2");
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await apiRequest<{ ok: boolean }>("/me");

  assert.deepEqual(response, { ok: true });
  assert.equal(refreshCalls, 1);
  assert.equal(protectedCalls, 2);
});

test("apiRequest stops after a second 401 following refresh", async () => {
  let refreshCalls = 0;
  let protectedCalls = 0;

  configureAccessTokenProvider({
    async getAccessToken() {
      return getStoredAccessToken();
    },
    async refreshAccessToken() {
      refreshCalls += 1;
      setStoredAccessToken("access-2");
      return "access-2";
    },
  });

  setStoredAccessToken("access-1");

  globalThis.fetch = async () => {
    protectedCalls += 1;
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "still expired" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  };

  await assert.rejects(
    () => apiRequest("/me"),
    (error: unknown) => error instanceof ApiError && error.status === 401 && error.code === "UNAUTHORIZED"
  );

  assert.equal(refreshCalls, 1);
  assert.equal(protectedCalls, 2);
});


