import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@hotpursuit/shared";
import { useLanguage } from "@/i18n/LanguageContext";
import { brand, siteLinks } from "@/data/site";

const NAV_ITEMS = [
  { to: "/", key: "home" },
  { to: "/store", key: "pgStore" },
  { to: "/server", key: "pgServer" },
  { to: "/applications", key: "pgApplications" },
  { to: "/community", key: "pgCommunity" },
  { to: "/media", key: "pgMedia" },
  { to: "/news", key: "pgNews" },
  { to: "/leaderboards", key: "pgLeaderboards" },
  { to: "/support", key: "pgSupport" },
];

export function AppLayout() {
  const { t, lang, toggle } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-9 w-9 rounded-md object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-lg font-bold tracking-wide text-ink">
              HOT <span className="text-accent">PURSUIT</span> RP
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "text-mute hover:text-ink",
                  )
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark sm:block"
            >
              {t("loginShort")}
            </Link>
            <button
              type="button"
              onClick={toggle}
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-bold text-ink transition-colors hover:text-accent"
              aria-label="Toggle language"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-ink lg:hidden"
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="border-t border-line bg-bg lg:hidden">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-semibold",
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "text-mute hover:text-ink",
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-accent"
              >
                {t("loginShort")}
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const social = siteLinks.social;
  const hasSocial = Object.values(social).some((s) => !!s);

  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-9 w-9 rounded-md object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-lg font-bold text-ink">
              HOT <span className="text-accent">PURSUIT</span> RP
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-mute">
            {brand.tagline}
          </p>
        </div>

        <div>
          <div className="mb-3 text-sm font-bold text-ink">{t("footerNav")}</div>
          <ul className="space-y-2 text-sm text-mute">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-accent">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-bold text-ink">
            {t("footerCommunity")}
          </div>
          {hasSocial ? (
            <ul className="space-y-2 text-sm text-mute">
              {Object.entries(social)
                .filter(([, u]) => !!u)
                .map(([platform, url]) => (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="capitalize hover:text-accent"
                    >
                      {platform}
                    </a>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">{t("footerNoSocial")}</p>
          )}
        </div>

        <div>
          <div className="mb-3 text-sm font-bold text-ink">
            {t("footerHelp")}
          </div>
          {siteLinks.discord ? (
            <a
              href={siteLinks.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              {t("discordSupport")}
            </a>
          ) : (
            <p className="text-sm text-mute">{t("footerNoSocial")}</p>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-mute sm:px-6">
          © {year} {brand.name} {t("footerRights")}
        </div>
      </div>
    </footer>
  );
}
