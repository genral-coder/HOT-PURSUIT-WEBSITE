import type { AuthUser } from "@hotpursuit/types";

/**
 * Thin API client. Uses HTTP-only session cookies (credentials: "include") —
 * auth tokens never live in localStorage or JS-accessible storage.
 *
 * Only PUBLIC values may come from Vite env vars. Never put secrets here.
 * @see apps/api .env.example for the server-side secret config.
 */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      code = body.error;
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error response */
    }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** GET /api/auth/me */
export function fetchMe(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/auth/me");
}

/** POST /api/auth/logout */
export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

/** Start the Discord OAuth login flow by navigating to the backend endpoint. */
export function loginWithDiscord(): void {
  window.location.assign(`${API_BASE}/auth/discord`);
}
