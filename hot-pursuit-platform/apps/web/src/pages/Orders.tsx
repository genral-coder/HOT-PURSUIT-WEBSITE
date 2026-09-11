import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderSummary } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchMyOrders, ApiError } from "@/services/api";
import { loginWithDiscord } from "@/services/api";

export function MyOrdersPage() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setLoading(true);
    fetchMyOrders()
      .then((res) => {
        if (!cancelled) {
          setOrders(res.orders);
          setLoading(false);
        }
      })
      .catch((e: ApiError) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading) return <Skeleton />;
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-ink">{t("pgOrders")}</h1>
        <p className="mb-6 text-sm text-mute">{t("loginNote")}</p>
        <button
          type="button"
          onClick={loginWithDiscord}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
        >
          {t("loginShort")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">
        {t("pgOrders")}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-line bg-panel p-4 text-sm text-accent">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-panel p-10 text-center">
          <p className="text-sm text-mute">{t("ordersEmpty")}</p>
          <Link
            to="/store"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("pgStore")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-bg-soft p-4 transition-colors hover:border-accent/40 sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink">
                  {order.orderNumber}
                </div>
                <div className="mt-1 text-xs text-mute">
                  {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : undefined)}
                  {" · "}
                  {order.itemCount} {order.itemCount === 1 ? t("orderItem") : t("orderItems")}
                </div>
              </div>
              <StatusBadge status={order.status} label={t(`orderStatus_${order.status}`)} />
              <PaymentBadge status={order.paymentStatus} label={t(`paymentStatus_${order.paymentStatus}`)} />
              <div className="w-24 text-end text-sm font-bold text-ink">
                {formatCents(order.totalCents, order.currency)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const color =
    status === "PAID" || status === "COMPLETED"
      ? "border-on/40 bg-on/10 text-on"
      : status === "PENDING"
        ? "border-gold/40 bg-gold/10 text-gold"
        : status === "FAILED" || status === "CANCELLED"
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-line bg-panel text-mute";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

function PaymentBadge({ status, label }: { status: string; label: string }) {
  const color =
    status === "PAID"
      ? "border-on/40 bg-on/10 text-on"
      : status === "UNPAID"
        ? "border-gold/40 bg-gold/10 text-gold"
        : "border-line bg-panel text-mute";
  return (
    <span className={`hidden rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide sm:inline ${color}`}>
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-lg border border-line bg-panel"
        />
      ))}
    </div>
  );
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}