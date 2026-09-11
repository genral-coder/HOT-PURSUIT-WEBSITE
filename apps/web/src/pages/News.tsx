import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { newsPosts } from "@/data/public";
import { siteLinks } from "@/data/site";
import { usePageMeta } from "@/hooks/usePageMeta";

export function NewsPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgNews"),
    description: t("newsSub"),
    canonicalPath: "/news",
  });

  const realNews = newsPosts.filter((n) => !n.sample);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("newsEyebrow")} title={t("newsTitle")} subtitle={t("newsSub")} />

      {realNews.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {realNews.map((n) => (
            <article
              key={n.title}
              className="flex flex-col rounded-lg border border-line bg-panel p-6"
            >
              {n.tag && (
                <span className="mb-3 w-fit rounded-full border border-line bg-bg-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
                  {n.tag}
                </span>
              )}
              <h2 className="mb-2 text-lg font-bold text-ink">{n.title}</h2>
              <p className="flex-1 text-sm leading-relaxed text-mute">
                {lang === "ar" ? n.excerptAr ?? n.excerpt : n.excerpt}
              </p>
              {n.date && (
                <time className="mt-4 text-xs text-mute">{n.date}</time>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-panel p-16 text-center">
          <div className="mb-3 text-5xl">📰</div>
          <h2 className="mb-2 text-2xl font-bold text-ink">{t("newsEmptyTitle")}</h2>
          <p className="mx-auto mb-6 max-w-md text-mute">{t("newsEmptyText")}</p>
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
      )}
    </div>
  );
}
