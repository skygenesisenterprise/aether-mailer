import assert from "node:assert/strict";
import test from "node:test";

import { forgotPasswordSchema, loginSchema, registerSchema } from "../../lib/auth/schemas.ts";

test("login schema rejects invalid email", () => {
  const result = loginSchema.safeParse({ email: "bad", password: "secret" });
  assert.equal(result.success, false);
});

test("register schema enforces password confirmation and strength", () => {
  const result = registerSchema.safeParse({
    displayName: "Alice",
    email: "alice@example.com",
    password: "weakpass",
    confirmPassword: "other",
    workspaceName: "",
  });
  assert.equal(result.success, false);
});

test("forgot password schema accepts a valid email", () => {
  const result = forgotPasswordSchema.safeParse({ email: "alice@example.com" });
  assert.equal(result.success, true);
});
