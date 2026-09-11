import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { mediaFilterOptions } from "@/data/media";
import { siteLinks } from "@/data/site";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";

export function MediaPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgMedia"),
    description: t("mediaSub"),
    canonicalPath: "/media",
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const filters = mediaFilterOptions;

  // No real media content has been published yet (media ships via a future
  // CMS/FiveM capture pipeline). Until then the gallery renders an explicit
  // "coming soon" state — never fake screenshots or videos.

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("mediaEyebrow")} title={t("mediaTitle")} subtitle={t("mediaSub")} />

      {/* Filter tabs — kept for the upcoming gallery */}
      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
              activeFilter === f.id
                ? "border-accent bg-accent text-white"
                : "border-line bg-panel text-mute hover:border-accent hover:text-ink"
            }`}
          >
            {lang === "ar" ? f.labelAr : f.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-line bg-panel p-16 text-center">
        <div className="mb-3 text-5xl">🎞️</div>
        <h2 className="mb-2 text-2xl font-bold text-ink">{t("mediaEmptyTitle")}</h2>
        <p className="mx-auto mb-6 max-w-md text-mute">{t("mediaEmptyText")}</p>
        {siteLinks.discord && (
          <a
            href={siteLinks.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
          >
            {t("joinDiscord")}
          </a>
        )}
      </div>
    </div>
  );
}