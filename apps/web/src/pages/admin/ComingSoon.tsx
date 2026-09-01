import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Admin module placeholder. Modules without real backend support render here
 * marked NOT AVAILABLE (COMING SOON) — never fake data.
 */
export function AdminComingSoon({ moduleKey }: { moduleKey: string }) {
  const { t } = useLanguage();
  const label = t(moduleKey);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink sm:text-3xl">
        HOT <span className="text-accent">PURSUIT</span> {label}
      </h1>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-panel p-16 text-center">
        <div className="mb-3 text-4xl">🚧</div>
        <div className="mb-2 text-lg font-bold text-ink">{t("adminNotAvailable")}</div>
        <p className="max-w-md text-sm text-mute">
          {t("adminDashboardNote")}
        </p>
      </div>
    </div>
  );
}
