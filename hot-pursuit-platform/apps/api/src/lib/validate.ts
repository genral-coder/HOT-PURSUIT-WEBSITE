import { ApiError } from "./errors.js";

/** Basic guard: exact non-empty string length limits. */
export function str(
  value: unknown,
  opts: { name: string; min?: number; max?: number; required?: boolean },
): string {
  const { name, min = 1, max = 500, required = true } = opts;
  if (typeof value !== "string") {
    if (!required) return "";
    throw ApiError.badRequest("invalid_input", `${name} must be a string.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw ApiError.badRequest("invalid_input", `${name} is required.`);
  }
  if (trimmed.length < min || trimmed.length > max) {
    throw ApiError.badRequest(
      "invalid_input",
      `${name} must be between ${min} and ${max} characters.`,
    );
  }
  return trimmed;
}

/** Parse and validate a numeric product id from a route param or body. */
export function productId(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw ApiError.badRequest("invalid_product_id", "Invalid product id.");
  }
  return n;
}

/** Validate a Discord OAuth authorization code from the callback query. */
export function authorizationCode(value: unknown): string {
  const code = typeof value === "string" ? value : "";
  if (!code || code.length < 10 || code.length > 1024) {
    throw ApiError.badRequest("invalid_oauth_code", "Invalid authorization code.");
  }
  return code;
}

/** Validate the OAuth `state` nonce from the callback query. */
export function oauthState(value: unknown): string {
  const s = typeof value === "string" ? value : "";
  if (!s || s.length < 8 || s.length > 256) {
    throw ApiError.badRequest("invalid_oauth_state", "Invalid OAuth state.");
  }
  return s;
}
