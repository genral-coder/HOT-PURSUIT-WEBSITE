import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@hotpursuit/shared";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "./AuthContext";

/**
 * Header account control.
 * - Logged out → "LOGIN" button that starts Discord OAuth.
 * - Logged in  → Discord avatar + username (with a small menu: Profile,
 *   Admin if authorized, Logout).
 *
 * NOTE: Admin visibility here is UI only. Real authorization is enforced by
 * the backend on every /api/admin call.
 */
export function UserMenu() {
  const { t } = useLanguage();
  const { user, isAdmin, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <span className="hidden h-8 w-20 animate-pulse rounded-md bg-panel sm:block" />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="hidden items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark sm:inline-flex"
      >
        <DiscordIcon className="h-4 w-4" />
        <span>{t("loginShort")}</span>
      </button>
    );
  }

  const displayName = user.discord.globalName || user.discord.username;

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-md border border-line bg-panel px-2 py-1 text-ink transition-colors hover:border-accent/50"
      >
        <Avatar user={user} size={26} />
        <span className="max-w-[120px] truncate text-sm font-semibold">
          {displayName}
        </span>
        <DiscordIcon className="h-3.5 w-3.5 text-mute" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute end-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-line bg-bg-soft shadow-2xl animate-fade-in"
          >
            <div className="flex items-center gap-3 border-b border-line px-3 py-3">
              <Avatar user={user} size={34} />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-ink">
                  {displayName}
                </div>
                <div className="truncate text-xs text-mute">
                  {user.discord.username}
                </div>
              </div>
            </div>
            <div className="p-1.5">
              <MenuItem
                to="/profile"
                onClick={() => setOpen(false)}
                label={t("pgProfile")}
              />
              {isAdmin && (
                <MenuItem
                  to="/admin"
                  onClick={() => setOpen(false)}
                  label={t("adminTitle")}
                />
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md px-3 py-2 text-start text-sm font-semibold text-accent transition-colors hover:bg-panel"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({
  user,
  size,
}: {
  user: { discord: { avatar?: string | null; username: string } };
  size: number;
}) {
  if (user.discord.avatar) {
    return (
      <img
        src={user.discord.avatar}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/20 text-ink"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {user.discord.username.charAt(0).toUpperCase()}
    </span>
  );
}

function MenuItem({
  to,
  onClick,
  label,
}: {
  to: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2 text-start text-sm font-semibold text-ink transition-colors hover:bg-panel"
    >
      {label}
    </Link>
  );
}

export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("w-4 h-4", className)}>
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.8 13.8 0 0 0-.64 1.28 18.3 18.3 0 0 0-5.5 0 13.8 13.8 0 0 0-.64-1.28c-1.71.3-3.37.8-4.93 1.51C1.1 8.66.83 12.82 1.97 16.86a19.9 19.9 0 0 0 6.03 3.04c.49-.66.92-1.36 1.3-2.1a12.9 12.9 0 0 1-2.04-.98c.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.48 0c.17.14.33.27.5.4-.65.39-1.33.72-2.04.98.37.74.8 1.44 1.3 2.1a19.9 19.9 0 0 0 6.03-3.04c1.36-4.68-.21-8.8-2.33-12.5ZM8.6 14.42c-1.18 0-2.15-1.08-2.15-2.42s.95-2.43 2.15-2.43c1.21 0 2.18 1.09 2.15 2.43 0 1.34-.94 2.42-2.15 2.42Zm6.8 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.43 2.15-2.43c1.21 0 2.18 1.09 2.15 2.43 0 1.34-.94 2.42-2.15 2.42Z" />
    </svg>
  );
}
