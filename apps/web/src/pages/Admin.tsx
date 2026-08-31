import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

/**
 * Admin foundation. This is intentionally minimal — the full Admin Dashboard,
 * Management UIs and backend admin APIs arrive in later phases.
 *
 * Only authenticated + authorized admins reach this page (see RequireAdmin).
 * The backend independently enforces authorization on admin APIs.
 */
export function AdminPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          HOT <span className="text-accent">PURSUIT</span> {t("adminTitle")}
        </h1>
        <p className="mt-1 text-sm text-mute">{t("adminFoundation")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Roles" value={user?.roles.join(", ") || "—"} />
        <StatCard
          label="Permissions"
          value={String(user?.permissions.length ?? 0)}
        />
        <StatCard label="Status" value="Active" />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-panel p-6">
        <div className="mb-3 text-sm font-bold text-ink">MODULES</div>
        <ul className="flex flex-wrap gap-2 text-xs">
          {[
            "players",
            "store",
            "orders",
            "applications",
            "tickets",
            "news",
            "media",
            "server",
            "admins",
            "settings",
          ].map((m) => (
            <li
              key={m}
              className="rounded-full border border-line bg-bg-soft px-3 py-1.5 font-semibold uppercase tracking-wide text-mute"
            >
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
