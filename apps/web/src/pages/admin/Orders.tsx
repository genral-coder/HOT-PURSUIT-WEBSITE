import { useCallback, useEffect, useState } from "react";
import type { AdminOrderRow, OrderStatus, PaymentStatus } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Modal } from "@/components/Modal";
import {
  fetchAdminOrders,
  fetchAdminOrder,
  updateAdminOrderStatus,
  ApiError,
} from "@/services/api";
import type { AdminOrderQuery } from "@/services/api";

/**
 * Admin Orders — /admin/orders.
 *
 * Real orders from the backend (RBAC orders.view). Lines, statuses and totals
 * come from the server; the client NEVER fabricates data. Status changes are
 * only offered for staff with orders.manage and are enforced server-side via
 * the controlled transition maps.
 */
const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];

export function AdminOrdersPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [rows, setRows] = useState<Array<{ id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; currency: string; totalCents: number; itemCount: number; provider: string; createdAt: string }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [payFilter, setPayFilter] = useState("");

  const [detail, setDetail] = useState<AdminOrderRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canManage = !!user?.permissions.includes("orders.manage");

  const load = useCallback(async (query: AdminOrderQuery = {}) => {
    setLoading(true);
    try {
      const res = await fetchAdminOrders(query);
      setRows(res.orders);
      setTotal(res.total);
      setPage(Math.max(1, query.page ?? 1));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params: AdminOrderQuery = { page, limit };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    if (payFilter) params.paymentStatus = payFilter;
    void load(params);
  }, [page, statusFilter, payFilter, search, load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetchAdminOrder(id);
      setDetail(res.order);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (field: "status" | "paymentStatus", value: OrderStatus | PaymentStatus) => {
    if (!detail) return;
    setSavingStatus(`${field}:${value}`);
    try {
      const body =
        field === "status"
          ? { status: value as OrderStatus }
          : { paymentStatus: value as PaymentStatus };
      await updateAdminOrderStatus(detail.id, body);
      const res = await fetchAdminOrder(detail.id);
      setDetail(res.order);
      setToast(t("adminOrdersSaved"));
      await load({ page, limit, ...(statusFilter ? { status: statusFilter } : {}), ...(payFilter ? { paymentStatus: payFilter } : {}), ...(search.trim() ? { search: search.trim() } : {}) });
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSavingStatus(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">{t("adminOrders")}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-line bg-panel p-4 text-sm text-accent">{error}</div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder={t("adminOrdersSearch")}
          className="w-64 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        >
          <option value="">{t("adminOrdersStatusAll")}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`orderStatus_${s}`)}</option>
          ))}
        </select>
        <select
          value={payFilter}
          onChange={(e) => { setPage(1); setPayFilter(e.target.value); }}
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        >
          <option value="">{t("adminOrdersPaymentAll")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`paymentStatus_${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-line bg-bg-soft">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-panel" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-mute">{t("adminOrdersEmpty")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-widest text-mute">
                <th className="px-4 py-3 text-start font-bold">{t("orderNumber")}</th>
                <th className="hidden px-4 py-3 text-start font-bold md:table-cell">{t("orderCreated")}</th>
                <th className="px-4 py-3 text-start font-bold">{t("orderStatus")}</th>
                <th className="hidden px-4 py-3 text-start font-bold sm:table-cell">{t("orderPayment")}</th>
                <th className="hidden px-4 py-3 text-start font-bold lg:table-cell">{t("orderItems")}</th>
                <th className="px-4 py-3 text-end font-bold">{t("orderTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => void openDetail(r.id)}
                  className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-panel"
                >
                  <td className="px-4 py-3 font-bold text-ink">{r.orderNumber}</td>
                  <td className="hidden px-4 py-3 text-mute md:table-cell">
                    {new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : undefined)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={badgeTone(r.status)}>{t(`orderStatus_${r.status}`)}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge tone={badgeTone(r.paymentStatus)}>{t(`paymentStatus_${r.paymentStatus}`)}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-mute lg:table-cell">{r.itemCount}</td>
                  <td className="px-4 py-3 text-end font-semibold text-ink">
                    {formatCents(r.totalCents, r.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-line bg-panel px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationPrev")}
          </button>
          <span className="text-mute">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-line bg-panel px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationNext")}
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={detailLoading || detail !== null}
        onClose={() => { setDetail(null); setDetailLoading(false); }}
        title={detail ? detail.orderNumber : t("adminOrdersLoading")}
        wide
      >
        {detail && (
          <DetailBody
            order={detail}
            canManage={canManage}
            saving={savingStatus}
            onStatus={handleStatusChange}
            lang={lang}
            t={t}
          />
        )}
      </Modal>

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-accent-glow transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}
        aria-live="polite"
      >
        {String(toast ?? "")}
      </div>
    </div>
  );
}

function DetailBody({
  order, canManage, saving, onStatus, lang, t,
}: {
  order: AdminOrderRow;
  canManage: boolean;
  saving: string | null;
  onStatus: (field: "status" | "paymentStatus", value: OrderStatus | PaymentStatus) => void;
  lang: string;
  t: (k: string, v?: Record<string, string>) => string;
}) {
  return (
    <div className="space-y-4">
      {/* Buyer */}
      <div className="rounded-lg border border-line bg-panel p-3 text-sm">
        <div className="text-xs font-bold uppercase tracking-widest text-mute">{t("adminOrderUser")}</div>
        <div className="mt-1 font-semibold text-ink">
          {order.user.discordGlobalName || order.user.discordUsername}
          <span className="ms-2 text-xs font-normal text-mute">{order.user.discordUsername}</span>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-line bg-panel p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">{t("orderItems")}</div>
        <ul className="space-y-1.5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold text-ink">
                {lang === "ar" && item.productNameAr ? item.productNameAr : item.productName}
                {item.quantity > 1 && <span className="ms-1.5 text-xs font-normal text-mute">× {item.quantity}</span>}
              </span>
              <span className="shrink-0 text-mute">{formatCents(item.totalCents, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between gap-3 border-t border-line pt-2 text-sm font-bold text-ink">
          <span>{t("orderTotal")}</span>
          <span>{formatCents(order.totalCents, order.currency)}</span>
        </div>
      </div>

      {/* Status controls */}
      <div className="rounded-lg border border-line bg-panel p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">
          {t("orderStatus")} · <span className="font-normal normal-case">{t(`orderStatus_${order.status}`)}</span>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
              <button
                key={s}
                type="button"
                disabled={saving !== null}
                onClick={() => onStatus("status", s)}
                className="rounded-full border border-line bg-bg-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40"
              >
                {t(`orderStatus_${s}`)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mute">{t("adminOrdersManageHint")}</p>
        )}

        <div className="mt-3 mb-2 text-xs font-bold uppercase tracking-widest text-mute">
          {t("orderPayment")} · <span className="font-normal normal-case">{t(`paymentStatus_${order.paymentStatus}`)}</span>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_STATUSES.filter((s) => s !== order.paymentStatus).map((s) => (
              <button
                key={s}
                type="button"
                disabled={saving !== null}
                onClick={() => onStatus("paymentStatus", s)}
                className="rounded-full border border-line bg-bg-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-on/60 hover:text-on disabled:opacity-40"
              >
                {t(`paymentStatus_${s}`)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: string; children: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

function badgeTone(value: string): string {
  if (value === "PAID" || value === "COMPLETED") return "border-on/40 bg-on/10 text-on";
  if (value === "PENDING" || value === "PARTIALLY_REFUNDED") return "border-gold/40 bg-gold/10 text-gold";
  if (value === "FAILED" || value === "CANCELLED" || value === "REFUNDED") return "border-accent/40 bg-accent/10 text-accent";
  return "border-line bg-panel text-mute";
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}