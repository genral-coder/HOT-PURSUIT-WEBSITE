import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@hotpursuit/shared";
import type { AdminSummary } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchAdminSummary } from "@/services/api";

/**
 * Admin Dashboard. Shows ONLY metrics the backend actually provides.
 * Every module without real backend support displays "NOT AVAILABLE" — never
 * fabricated numbers (no fake revenue, orders, players, applicants, tickets).
 */
export function AdminDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminSummary()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          HOT <span className="text-accent">PURSUIT</span> {t("adminDashboard")}
        </h1>
        <p className="mt-1 text-sm text-mute">
          {user?.discord.username} · {user?.roles.join(", ") || t("adminNoRole")}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-line bg-panel p-4 text-sm text-accent">
          {error}
        </div>
      )}

      {/* Server / backend status — REAL */}
      <div className="mb-4">
        <SectionTitle>{t("adminServerStatus")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label={t("adminDatabase")}
            value={
              summary
                ? summary.database === "connected"
                  ? t("adminConnected")
                  : t("adminUnavailable")
                : "—"
            }
            ok={summary?.database === "connected"}
          />
          <StatCard label={t("adminUsers")} value={summary ? String(summary.users) : "—"} />
          <StatCard label={t("adminStaff")} value={summary ? String(summary.staff) : "—"} />
        </div>
      </div>

      {/* Modules — all backed by real systems only; the rest are NOT AVAILABLE */}
      <div className="mb-4">
        <SectionTitle>{t("adminCards")}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <NotAvailableCard label={t("adminOrders")} />
          <NotAvailableCard label={t("adminApplications")} />
          <NotAvailableCard label={t("adminTickets")} />
          <NotAvailableCard label={t("adminPlayers")} />
          <NotAvailableCard label={t("pgStore")} />
          <NotAvailableCard label={t("adminRebuild")} />
        </div>
      </div>

      <p className="text-xs text-mute">{t("adminDashboardNote")}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-bold",
          ok === undefined ? "text-ink" : ok ? "text-on" : "text-accent",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function NotAvailableCard({ label }: { label: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-mute">
        {t("adminNotAvailable")}
      </div>
    </div>
  );
}

