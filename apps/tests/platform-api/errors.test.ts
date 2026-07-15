import test from "node:test";
import assert from "node:assert/strict";

import { ApiError, classifyApiError, getUserFacingError } from "../../lib/api/errors.ts";

test("classifyApiError maps backend status codes", () => {
  assert.equal(classifyApiError(401), "unauthenticated");
  assert.equal(classifyApiError(403), "forbidden");
  assert.equal(classifyApiError(404), "not_found");
  assert.equal(classifyApiError(409), "conflict");
  assert.equal(classifyApiError(422), "validation_error");
  assert.equal(classifyApiError(503), "dependency_unavailable");
});

test("getUserFacingError hides server internals", () => {
  const error = new ApiError({
    status: 503,
    message: "redis is down",
    kind: "dependency_unavailable",
  });

  assert.equal(getUserFacingError(error), "Le service demandé est temporairement indisponible.");
});
