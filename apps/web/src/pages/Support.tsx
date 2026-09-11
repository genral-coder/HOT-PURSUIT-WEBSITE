import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { Accordion } from "@/components/Accordion";
import { faq } from "@/data/public";
import { siteLinks } from "@/data/site";
import { usePageMeta } from "@/hooks/usePageMeta";

export function SupportPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgSupport"),
    description: t("supportSub"),
    canonicalPath: "/support",
  });

  const ticketReady = !!siteLinks.discordTicket;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("supportEyebrow")} title={t("supportTitle")} subtitle={t("supportSub")} />

      {/* Contact channels */}
      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-3 text-4xl">🎫</div>
          <h2 className="mb-2 text-lg font-bold text-ink">{t("supportTicketsTitle")}</h2>
          {ticketReady ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-mute">
                {t("supportTicketsText")}
              </p>
              <a
                href={siteLinks.discordTicket}
                className="inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
              >
                {t("supportOpenTicket")}
              </a>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-mute">{t("supportTicketsSoon")}</p>
          )}
        </div>

        <div className="rounded-lg border border-line bg-panel p-6">
          <div className="mb-3 text-4xl">💬</div>
          <h2 className="mb-2 text-lg font-bold text-ink">{t("discordCommunityTitle")}</h2>
          {siteLinks.discord ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-mute">
                {t("supportDiscordText")}
              </p>
              <a
                href={siteLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md border border-line bg-panel px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent"
              >
                {t("joinDiscord")}
              </a>
            </>
          ) : (
            <p className="text-sm text-mute">{t("discordNotConfigured")}</p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-ink">{t("faqTitle")}</h2>
        <Accordion
          items={faq.map((item) => ({
            id: item.q,
            title: lang === "ar" ? item.qAr : item.q,
            content: (
              <p className="text-sm leading-relaxed text-mute">
                {lang === "ar" ? item.aAr : item.a}
              </p>
            ),
          }))}
        />
      </section>
    </div>
  );
}