import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const PAGE_KEYS: Record<
  string,
  { eyebrow: string; title: string; sub: string; comingSoon: boolean }
> = {
  server: { eyebrow: "serverEyebrow", title: "serverTitle", sub: "serverSub", comingSoon: true },
  applications: { eyebrow: "appEyebrow", title: "appTitle", sub: "appSub", comingSoon: false },
  community: { eyebrow: "comEyebrow", title: "comTitle", sub: "comSub", comingSoon: false },
  media: { eyebrow: "mediaEyebrow", title: "mediaTitle", sub: "mediaSub", comingSoon: false },
  news: { eyebrow: "newsEyebrow", title: "newsTitle", sub: "newsSub", comingSoon: false },
  leaderboards: { eyebrow: "lbEyebrow", title: "lbTitle", sub: "lbSub", comingSoon: true },
  support: { eyebrow: "supEyebrow", title: "supTitle", sub: "supSub", comingSoon: false },
  profile: { eyebrow: "loginEyebrow", title: "profileTitle", sub: "profileSub", comingSoon: true },
  notfound: { eyebrow: "404", title: "Page Not Found", sub: "The page you're looking for doesn't exist.", comingSoon: false },
};

export function PlaceholderPage({ page }: { page: string }) {
  const { t } = useLanguage();
  const meta = PAGE_KEYS[page] ?? PAGE_KEYS.notfound;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6">
      <span className="mb-3 inline-block rounded-full border border-line bg-panel px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">
        {page === "notfound" ? meta.eyebrow : t(meta.eyebrow)}
      </span>
      <h1 className="mb-3 text-3xl font-bold text-ink sm:text-4xl">
        {page === "notfound" ? meta.title : t(meta.title)}
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-mute">
        {page === "notfound" ? meta.sub : t(meta.sub)}
      </p>

      {page !== "notfound" && (
        <div className="rounded-lg border border-line bg-panel p-10">
          <div className="mb-2 text-4xl">🚧</div>
          <div className="mb-1 text-lg font-bold text-ink">
            {t(meta.comingSoon ? "comingSoon" : "comingSoonTiny")}
          </div>
          <p className="text-sm text-mute">
            {page === "profile"
              ? t("loginNote")
              : page === "server"
                ? t("serverDemoNote")
                : t("comingSoonDesc")}
          </p>
        </div>
      )}

      {page === "notfound" && (
        <Link
          to="/"
          className="inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
        >
          {t("home")}
        </Link>
      )}
    </div>
  );
}
