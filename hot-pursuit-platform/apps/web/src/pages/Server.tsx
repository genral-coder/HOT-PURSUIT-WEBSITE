import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { serverInfo, joinSteps } from "@/data/server";
import { features, jobs } from "@/data/public";
import { siteLinks } from "@/data/site";
import { usePageMeta } from "@/hooks/usePageMeta";

export function ServerPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgServer"),
    description: t("serverSub"),
    canonicalPath: "/server",
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("serverEyebrow")} title={t("serverTitle")} subtitle={t("serverSub")} />

      {/* Live server status — explicitly NOT connected (never fake) */}
      <section className="mb-10 rounded-lg border border-line bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-mute">
              {t("serverStatus")}
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-mute" aria-hidden="true" />
              {t("ssNotConnected")}
            </div>
          </div>
          <div className="text-sm text-mute">
            {t("ssPlayers")}: {t("comingSoon")}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <MetaItem label={t("ssIp")} value={t("connectNotReady")} />
          <MetaItem label={t("ssVersion")} value="—" />
          <MetaItem label={t("ssRestart")} value="—" />
          <MetaItem label={t("ssUptime")} value="—" />
          <MetaItem label={t("ssRegion")} value={serverInfo.region ?? t("connectNotReady")} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {siteLinks.play ? (
            <a
              href={siteLinks.play}
              className="rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-dark"
            >
              {t("connectBtn")}
            </a>
          ) : (
            <span className="inline-block cursor-default rounded-md border border-line bg-bg-soft px-6 py-3 text-sm font-bold uppercase tracking-wide text-mute">
              {t("connectSoon")}
            </span>
          )}
          {siteLinks.discord && (
            <a
              href={siteLinks.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-line bg-panel px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent"
            >
              {t("joinDiscord2")}
            </a>
          )}
        </div>
        <p className="mt-3 text-xs text-mute">{t("serverDemoNote")}</p>
      </section>

      {/* How to play / join */}
      <section className="mb-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">{t("howToPlayTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {joinSteps.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-line bg-panel p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mb-2 font-bold text-ink">
                {lang === "ar" ? s.titleAr : s.title}
              </h3>
              <p className="text-sm leading-relaxed text-mute">
                {lang === "ar" ? s.textAr : s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Server features */}
      <section className="mb-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">{t("secFeatures")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-line bg-panel p-6 text-center">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-base font-bold text-ink">
                {lang === "ar" ? f.titleAr : f.title}
              </h3>
              <p className="text-sm leading-relaxed text-mute">
                {lang === "ar" ? f.textAr : f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Departments / Jobs */}
      <section className="mb-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink">{t("jobsTitle")}</h2>
          <a
            href={siteLinks.discord || undefined}
            target={siteLinks.discord ? "_blank" : undefined}
            rel={siteLinks.discord ? "noopener noreferrer" : undefined}
            className="text-sm font-semibold text-accent hover:underline"
            aria-disabled={!siteLinks.discord}
          >
            {t("viewAllDepts")}
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-lg border border-line bg-panel p-5">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">{j.emoji}</span>
                <h3 className="font-bold text-ink">
                  {lang === "ar" ? j.nameAr ?? j.name : j.name}
                </h3>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-mute">
                {lang === "ar" ? j.descAr ?? j.desc ?? "" : j.desc ?? ""}
              </p>
              {j.features && j.features.length > 0 && (
                <ul className="space-y-1">
                  {j.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-mute">
                      <span className="text-accent">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Server description */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-ink">{t("aboutServerTitle")}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-mute">
          {t("aboutServerText")}
        </p>
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}
