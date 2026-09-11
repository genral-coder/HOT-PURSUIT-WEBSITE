import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, errorHandler } from "../src/lib/errors.js";
import { authorizationCode, productId, str } from "../src/lib/validate.js";

/**
 * Error + validation behaviour tests (no DB required).
 * Ensures clients never receive internal details and inputs are validated.
 */

test("ApiError carries a safe code + status", () => {
  const err = ApiError.forbidden("forbidden", "You do not have permission.");
  assert.equal(err.status, 403);
  assert.equal(err.code, "forbidden");
  assert.equal(err.message, "You do not have permission.");
});

test("errorHandler returns generic message for unknown errors in production", () => {
  const req = {} as never;
  const res = {
    statusCode: 0,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  } as any;

  process.env.NODE_ENV = "production";
  errorHandler(new Error("secret db details"), req, res, () => {});
  process.env.NODE_ENV = "development";

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, "internal_error");
  assert.doesNotMatch(JSON.stringify(res.body), /secret db details/);
});

test("errorHandler returns structured body for ApiError", () => {
  const req = {} as never;
  const res = {
    statusCode: 0,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  } as any;

  errorHandler(ApiError.unauthorized("auth_required", "You must be logged in."), req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "auth_required");
  assert.equal(res.body.message, "You must be logged in.");
});

test("productId rejects invalid values", () => {
  assert.throws(() => productId("abc"), ApiError);
  assert.throws(() => productId(0), ApiError);
  assert.throws(() => productId(-5), ApiError);
  assert.throws(() => productId(1.5), ApiError);
  assert.throws(() => productId(undefined), ApiError);
  assert.equal(productId("42"), 42);
});

test("authorizationCode validates length", () => {
  assert.throws(() => authorizationCode("short"), ApiError);
  assert.throws(() => authorizationCode(undefined), ApiError);
  assert.throws(() => authorizationCode(123 as never), ApiError);
  assert.equal(authorizationCode("ab".repeat(10)), "ab".repeat(10));
});

test("str trims and enforces length", () => {
  assert.throws(() => str("", { name: "name" }), ApiError);
  assert.throws(() => str("   ", { name: "name" }), ApiError);
  assert.throws(
    () => str("x".repeat(501), { name: "name", max: 500 }),
    ApiError,
  );
  assert.equal(str("  hello  ", { name: "name" }), "hello");
});
