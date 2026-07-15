import test from "node:test";
import assert from "node:assert/strict";

import {
  assertPublicLiveKitUrl,
  assertPublicRealtimeUrl,
  getApiBaseUrl,
  joinApiPath,
} from "../../lib/api/config.ts";

test("getApiBaseUrl uses internal URL on the server", () => {
  const previousInternal = process.env.API_INTERNAL_URL;
  const previousExpoPublic = process.env.EXPO_PUBLIC_API_URL;
  const previousPublic = process.env.NEXT_PUBLIC_API_URL;

  process.env.API_INTERNAL_URL = "http://server:8080/api/v1";
  process.env.EXPO_PUBLIC_API_URL = "http://meet.skygenesisenterprise.localhost/api/v1";
  process.env.NEXT_PUBLIC_API_URL = "/api/v1";

  assert.equal(getApiBaseUrl(), "http://server:8080/api/v1");

  process.env.API_INTERNAL_URL = previousInternal;
  process.env.EXPO_PUBLIC_API_URL = previousExpoPublic;
  process.env.NEXT_PUBLIC_API_URL = previousPublic;
});

test("getApiBaseUrl uses Expo public URL when no internal URL is configured", () => {
  const previousInternal = process.env.API_INTERNAL_URL;
  const previousExpoPublic = process.env.EXPO_PUBLIC_API_URL;
  const previousPublic = process.env.NEXT_PUBLIC_API_URL;

  delete process.env.API_INTERNAL_URL;
  process.env.EXPO_PUBLIC_API_URL = "http://meet.skygenesisenterprise.localhost/api/v1";
  process.env.NEXT_PUBLIC_API_URL = "/api/v1";

  assert.equal(getApiBaseUrl(), "http://meet.skygenesisenterprise.localhost/api/v1");

  process.env.API_INTERNAL_URL = previousInternal;
  process.env.EXPO_PUBLIC_API_URL = previousExpoPublic;
  process.env.NEXT_PUBLIC_API_URL = previousPublic;
});

test("joinApiPath builds API URLs from the configured base", () => {
  const previousInternal = process.env.API_INTERNAL_URL;
  process.env.API_INTERNAL_URL = "http://server:8080/api/v1";

  assert.equal(joinApiPath("/me"), "http://server:8080/api/v1/me");

  process.env.API_INTERNAL_URL = previousInternal;
});

test("public URL guards reject Docker and localhost hosts in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  assert.throws(() => assertPublicRealtimeUrl("wss://server/api/v1/realtime/ws"));
  assert.throws(() => assertPublicLiveKitUrl("ws://localhost:7880"));
  assert.equal(assertPublicLiveKitUrl("wss://webrtc.example.com"), "wss://webrtc.example.com");

  process.env.NODE_ENV = previousNodeEnv;
});
