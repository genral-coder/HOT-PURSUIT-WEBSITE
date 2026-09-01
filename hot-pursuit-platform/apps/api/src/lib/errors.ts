import type { NextFunction, Request, Response } from "express";

/** Structured API error sent to clients. Never leaks internals. */
export interface ApiErrorBody {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Application error with an HTTP status and a stable, client-safe `code`.
 * Internal error details (stack traces, DB errors) are NOT put on this object.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code = "bad_request", message?: string, details?: unknown) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(code = "unauthorized", message?: string) {
    return new ApiError(401, code, message);
  }
  static forbidden(code = "forbidden", message?: string) {
    return new ApiError(403, code, message);
  }
  static notFound(code = "not_found", message?: string) {
    return new ApiError(404, code, message);
  }
  static conflict(code = "conflict", message?: string) {
    return new ApiError(409, code, message);
  }
}

/** Wrap an async route handler so thrown errors reach the error middleware. */
export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

/**
 * Central error handler. Logs details server-side in development but returns
 * only a safe, generic error to clients in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = { error: err.code };
    if (err.message) body.message = err.message;
    if (err.details !== undefined) body.details = err.details;
    res.status(err.status).json(body);
    return;
  }

  // Unknown/DB errors: never leak internals to clients.
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== "production") console.error("[api] error:", err);
  else console.error("[api] error:", err instanceof Error ? err.message : err);
  res.status(500).json({ error: "internal_error", message: "Something went wrong." });
}
