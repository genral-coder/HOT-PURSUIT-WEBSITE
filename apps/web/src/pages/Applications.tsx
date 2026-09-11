import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { applications } from "@/data/public";
import { siteLinks } from "@/data/site";
import { usePageMeta } from "@/hooks/usePageMeta";

export function ApplicationsPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgApplications"),
    description: t("appsSub"),
    canonicalPath: "/applications",
  });

  const catalogue = applications;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("appsEyebrow")} title={t("appsTitle")} subtitle={t("appsSub")} />

      <div className="rounded-lg border border-line bg-panel p-6 text-sm leading-relaxed text-mute">
        {t("appsHowToNote")}
        {siteLinks.discordTicket ? (
          <a
            href={siteLinks.discordTicket}
            className="ml-1 font-semibold text-accent hover:underline"
          >
            {t("appsTicketLink")}
          </a>
        ) : (
          <span className="ml-1 font-semibold text-mute">{t("appsTicketSoon")}</span>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {catalogue.map((a) => (
          <div key={a.id} className="rounded-lg border border-line bg-panel p-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-3xl">{a.emoji}</span>
              <h2 className="text-xl font-bold text-ink">
                {lang === "ar" ? a.nameAr : a.name}
              </h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-mute">
              {lang === "ar" ? a.descAr ?? a.desc : a.desc ?? ""}
            </p>
            {a.requirements && a.requirements.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
                  {t("appsRequirements")}
                </div>
                <ul className="space-y-1.5">
                  {a.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-mute">
                      <span className="mt-0.5 text-accent">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
