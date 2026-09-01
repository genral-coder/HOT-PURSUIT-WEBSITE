import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { leaderboardCategories } from "@/data/leaderboards";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";

export function LeaderboardsPage() {
  const { t, lang } = useLanguage();
  usePageMeta({
    title: t("pgLeaderboards"),
    description: t("lbSub"),
    canonicalPath: "/leaderboards",
  });

  const [active, setActive] = useState("rich");

  const categories = leaderboardCategories;
  const current = categories.find((c) => c.id === active) ?? categories[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("lbEyebrow")} title={t("lbTitle")} subtitle={t("lbSub")} />

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
              active === c.id
                ? "border-accent bg-accent text-white"
                : "border-line bg-panel text-mute hover:border-accent hover:text-ink"
            }`}
          >
          {lang === "ar" ? c.nameAr ?? c.name : c.name}
          </button>
        ))}
      </div>

      {/* Leaderboard unavailable (live data not connected) */}
      <div className="rounded-lg border border-dashed border-line bg-panel p-16 text-center">
        <div className="mb-3 text-5xl">🏆</div>
        <h2 className="mb-2 text-2xl font-bold text-ink">{t("lbEmptyTitle")}</h2>
        <p className="mx-auto mb-2 max-w-md text-mute">{t("lbEmptyText")}</p>
        <p className="text-xs text-mute">
          {t("lbCurrent", { name: current.name })}
        </p>
      </div>
    </div>
  );
}