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

/* ── Admin API (all server-enforced; this client never decides authorization) ── */

import type {
  AddAdminInput,
  AdminOrderRow,
  AdminSummary,
  AdminUser,
  ChangeAdminInput,
  CheckoutItem,
  CreateOrderResult,
  Order,
  OrderStatus,
  OrderSummary,
  PagedOrders,
  PaymentStatus,
  Permission,
  RoleName,
} from "@hotpursuit/types";

export interface AdminMeta {
  roles: RoleName[];
  permissions: Permission[];
}

export function fetchAdminSummary(): Promise<AdminSummary> {
  return request<AdminSummary>("/admins/summary");
}

export function fetchAdmins(): Promise<{ admins: AdminUser[] }> {
  return request<{ admins: AdminUser[] }>("/admins");
}

export function fetchAdminMeta(): Promise<AdminMeta> {
  return request<AdminMeta>("/admins/meta");
}

export function addAdmin(input: AddAdminInput): Promise<{ admin: AdminUser }> {
  return request<{ admin: AdminUser }>("/admins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function changeAdmin(
  id: string,
  input: ChangeAdminInput,
): Promise<{ admin: AdminUser }> {
  return request<{ admin: AdminUser }>(`/admins/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function removeAdmin(id: string): Promise<{ id: string; removed: boolean }> {
  return request<{ id: string; removed: boolean }>(`/admins/${id}`, {
    method: "DELETE",
  });
}

/* ── Orders (user-facing) ── */

export function createOrder(
  items: CheckoutItem[],
): Promise<CreateOrderResult> {
  return request<CreateOrderResult>("/orders", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function fetchMyOrders(): Promise<{ orders: OrderSummary[] }> {
  return request<{ orders: OrderSummary[] }>("/orders");
}

export function fetchOrder(id: string): Promise<{ order: Order }> {
  return request<{ order: Order }>(`/orders/${id}`);
}

/* ── Admin orders ── */

export interface AdminOrderQuery {
  search?: string;
  status?: string;
  paymentStatus?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

export function fetchAdminOrders(
  params: AdminOrderQuery = {},
): Promise<PagedOrders> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.paymentStatus) q.set("paymentStatus", params.paymentStatus);
  if (params.provider) q.set("provider", params.provider);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<PagedOrders>(`/admin/orders${qs ? `?${qs}` : ""}`);
}

export function fetchAdminOrder(id: string): Promise<{ order: AdminOrderRow }> {
  return request<{ order: AdminOrderRow }>(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(
  id: string,
  body: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<{ ok: boolean; changed: unknown[]; order: { id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus } }> {
  return request(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
