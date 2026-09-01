import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "./AuthContext";

/**
 * Route guard for the /admin area.
 *
 * UI protection only — the backend independently rejects unauthorized calls on
 * every /api/admin route. Frontend visibility must never be the security
 * boundary.
 *
 * States:
 *   - loading  → neutral loading placeholder
 *   - logged out → login required
 *   - logged in, no admin access → access denied
 *   - logged in + admin access → render children
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { user, loading, isAdmin, login } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center sm:px-6">
        <div className="mx-auto h-32 w-full max-w-md animate-pulse rounded-lg bg-panel" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-lg border border-line bg-panel p-10">
          <div className="mb-3 text-4xl">🔐</div>
          <h1 className="mb-2 text-2xl font-bold text-ink">{t("adminTitle")}</h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-mute">
            {t("adminLoginRequired")}
          </p>
          <button
            type="button"
            onClick={login}
            className="rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("loginDiscord")}
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-lg border border-line bg-panel p-10">
          <div className="mb-3 text-4xl">⛔</div>
          <h1 className="mb-2 text-2xl font-bold text-ink">{t("adminTitle")}</h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-mute">
            {t("adminAccessDenied")}
          </p>
          <Link
            to="/"
            className="inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
