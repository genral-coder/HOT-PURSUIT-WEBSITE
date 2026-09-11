import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { Order } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchOrder, ApiError } from "@/services/api";
import { assetUrl } from "@/utils/media";

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setLoading(true);
    fetchOrder(id)
      .then((res) => {
        if (!cancelled) {
          setOrder(res.order);
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
  }, [id, user, authLoading]);

  if (authLoading) return <Skeleton />;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-mute">
        {t("loginNote")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/orders" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">
        ← {t("ordersBackToList")}
      </Link>

      {error && (
        <div className="rounded-lg border border-dashed border-line bg-panel p-10 text-center">
          <p className="text-sm text-accent">{error}</p>
        </div>
      )}

      {loading && !order && <Skeleton />}

      {order && (
        <div className="overflow-hidden rounded-lg border border-line bg-bg-soft">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <div className="text-lg font-bold text-ink">{order.orderNumber}</div>
              <div className="mt-1 text-xs text-mute">
                {new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : undefined)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={badgeTone(order.status)}>{t(`orderStatus_${order.status}`)}</Badge>
              <Badge tone={badgeTone(order.paymentStatus)}>{t(`paymentStatus_${order.paymentStatus}`)}</Badge>
            </div>
          </div>

          {/* Items */}
          <div className="border-b border-line px-5 py-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">
              {t("orderItems")}
            </div>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-ink">
                    {item.productImage ? (
                      <img
                        src={assetUrl(item.productImage)}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-panel text-xs font-bold text-mute">
                        {item.productName.charAt(0)}
                      </span>
                    )}
                    <span className="truncate font-semibold">
                      {lang === "ar" && item.productNameAr ? item.productNameAr : item.productName}
                    </span>
                    {item.quantity > 1 && (
                      <span className="shrink-0 rounded bg-panel px-1.5 py-0.5 text-[11px] text-mute">
                        × {item.quantity}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-mute">
                    {formatCents(item.totalCents, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="space-y-1 px-5 py-4 text-sm">
            <div className="flex justify-between gap-3 text-mute">
              <span>{t("orderSubtotal")}</span>
              <span>{formatCents(order.subtotalCents, order.currency)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between gap-3 text-mute">
                <span>{t("orderDiscount")}</span>
                <span>-{formatCents(order.discountCents, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-line pt-2 text-base font-bold text-ink">
              <span>{t("orderTotal")}</span>
              <span>{formatCents(order.totalCents, order.currency)}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-line px-5 py-4 text-xs text-mute">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                {t("orderProvider")}: <span className="font-semibold text-ink">{t(`provider_${order.provider}`)}</span>
              </span>
              {order.providerPaymentId && (
                <span>
                  {t("orderPaymentId")}: <span className="font-mono">{order.providerPaymentId}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

function badgeTone(value: string): string {
  if (value === "PAID" || value === "COMPLETED") return "border-on/40 bg-on/10 text-on";
  if (value === "PENDING") return "border-gold/40 bg-gold/10 text-gold";
  if (value === "FAILED" || value === "CANCELLED" || value === "REFUNDED") return "border-accent/40 bg-accent/10 text-accent";
  return "border-line bg-panel text-mute";
}

function Skeleton() {
  return <div className="h-64 animate-pulse rounded-lg border border-line bg-panel" />;
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}