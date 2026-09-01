import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { rules } from "@/data/public";
import { usePageMeta } from "@/hooks/usePageMeta";

export function RulesPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgRules"),
    description: t("rulesSub"),
    canonicalPath: "/rules",
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("rulesEyebrow")} title={t("rulesTitle")} subtitle={t("rulesSub")} />

      <div className="rounded-lg border border-line bg-panel p-6 text-sm leading-relaxed text-mute">
        {t("rulesNotice")}
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {rules.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-line bg-panel p-6">
            <h2 className="mb-4 border-b border-line pb-3 text-lg font-bold text-ink">
              {lang === "ar" ? cat.nameAr : cat.name}
            </h2>
            <ul className="space-y-3">
              {cat.list.map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-mute">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{lang === "ar" ? rule.ar : rule.en}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}