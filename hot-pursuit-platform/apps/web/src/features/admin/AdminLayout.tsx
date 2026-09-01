import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@hotpursuit/shared";
import type { Permission } from "@hotpursuit/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

/**
 * Admin layout: a dark, cinematic sidebar nav on desktop that collapses into a
 * clean mobile menu. Navigation items are permission-aware (UI only) — the
 * backend independently enforces every permission on the corresponding API.
 *
 * Sections without real backend functionality are shown but marked COMING SOON
 * and route to the placeholders (never fake data).
 */

interface AdminNavItem {
  to: string;
  key: string;
  permission: Permission | null;
  comingSoon?: boolean;
}

const NAV_SECTIONS: Array<{ titleKey: string; items: AdminNavItem[] }> = [
  {
    titleKey: "adminNavGeneral",
    items: [
      { to: "/admin", key: "adminDashboard", permission: "admin.access" },
      { to: "/admin/admins", key: "adminManage", permission: "admins.manage" },
    ],
  },
  {
    titleKey: "adminNavModules",
    items: [
      { to: "/admin/store", key: "pgStore", permission: "store.view", comingSoon: true },
      { to: "/admin/orders", key: "adminOrders", permission: "orders.view", comingSoon: true },
      { to: "/admin/applications", key: "adminApplications", permission: "applications.view", comingSoon: true },
      { to: "/admin/tickets", key: "adminTickets", permission: "tickets.view", comingSoon: true },
      { to: "/admin/news", key: "pgNews", permission: "news.view", comingSoon: true },
      { to: "/admin/media", key: "pgMedia", permission: "media.manage", comingSoon: true },
      { to: "/admin/players", key: "adminPlayers", permission: "players.view", comingSoon: true },
      { to: "/admin/server", key: "adminServer", permission: "server.view", comingSoon: true },
      { to: "/admin/settings", key: "adminSettings", permission: "settings.manage", comingSoon: true },
    ],
  },
];

export function AdminLayout() {
  const { t, dir } = useLanguage();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hard client-side guard (defense in depth) — the backend still enforces.
  useEffect(() => {
    if (!isAdmin) navigate("/admin");
  }, [isAdmin, navigate]);

  // If somehow not admin/has no admin.access, nothing to render.
  if (!isAdmin) return null;

  const can = (p: Permission | null) => (p ? user?.permissions.includes(p) : true);

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 self-start rounded-lg border border-line bg-bg-soft p-3">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((i) => can(i.permission));
            if (!items.length) return null;
            return (
              <div key={section.titleKey} className="mb-3 last:mb-0">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-mute">
                  {t(section.titleKey)}
                </div>
                {items.map((item) => (
                  <SidebarLink key={item.to} item={item} dir={dir} onNavigate={() => setMenuOpen(false)} />
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-bold text-ink"
          >
            ☰ {t("adminMenu")}
          </button>
        </div>

        {menuOpen && (
          <div className="mb-4 rounded-lg border border-line bg-bg-soft p-2 lg:hidden">
            {NAV_SECTIONS.map((section) => {
              const items = section.items.filter((i) => can(i.permission));
              if (!items.length) return null;
              return (
                <div key={section.titleKey} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-mute">
                    {t(section.titleKey)}
                  </div>
                  {items.map((item) => (
                    <SidebarLink key={item.to} item={item} dir={dir} onNavigate={() => setMenuOpen(false)} />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  dir,
  onNavigate,
}: {
  item: AdminNavItem;
  dir: string;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <NavLink
      to={item.to}
      end={item.to === "/admin"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "mx-0 my-0.5 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors",
          isActive ? "bg-accent/15 text-accent" : "text-mute hover:bg-panel hover:text-ink",
        )
      }
    >
      <span className={cn(dir === "rtl" ? "text-right" : "")}>{t(item.key)}</span>
      {item.comingSoon && (
        <span className="ml-2 rounded-full border border-line bg-panel px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-mute">
          {t("comingSoon")}
        </span>
      )}
    </NavLink>
  );
}
