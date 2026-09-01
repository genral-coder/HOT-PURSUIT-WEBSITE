import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/PageHero";
import { siteLinks } from "@/data/site";
import { socialLinks } from "@/data/public";
import { usePageMeta } from "@/hooks/usePageMeta";

interface PlatformMeta {
  id: string;
  name: string;
  emoji: string;
  url: string;
  primary?: boolean;
}

export function CommunityPage() {
  const { t } = useLanguage();
  usePageMeta({
    title: t("pgCommunity"),
    description: t("comSub"),
    canonicalPath: "/community",
  });

  // Build a single platform list from config (no duplicated URLs). Each
  // platform present in `siteLinks.social` (or the discord invite) is shown;
  // metadata (name/emoji) comes from the shared socialLinks catalog.
  const catalog = new Map(socialLinks.map((s) => [s.id, s]));
  const platforms: PlatformMeta[] = [];

  const push = (id: string, url: string, primary = false) => {
    const meta = catalog.get(id);
    platforms.push({
      id,
      name: meta?.name ?? id,
      emoji: meta?.emoji ?? "💬",
      url,
      primary: primary || meta?.primary,
    });
  };

  if (siteLinks.discord) push("discord", siteLinks.discord, true);

  const socialMap = siteLinks.social as Record<string, string>;
  (Object.keys(socialMap) as Array<keyof typeof siteLinks.social>).forEach((k) => {
    const url = socialMap[k];
    if (url) push(k as string, url);
  });

  const available = platforms.filter((p) => p.url);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHero eyebrow={t("comEyebrow")} title={t("comTitle")} subtitle={t("comSub")} />

      {/* Discord is the primary community */}
      {siteLinks.discord ? (
        <section className="mb-10 rounded-lg border border-line bg-panel p-8 text-center">
          <div className="mb-3 text-5xl">💬</div>
          <h2 className="mb-2 text-2xl font-bold text-ink">{t("discordCommunityTitle")}</h2>
          <p className="mx-auto mb-6 max-w-xl text-base leading-relaxed text-mute">
            {t("discordCommunityText")}
          </p>
          <a
            href={siteLinks.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-[#5865F2] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            {t("joinDiscord")}
          </a>
        </section>
      ) : (
        <section className="mb-10 rounded-lg border border-dashed border-line bg-panel p-10 text-center">
          <p className="text-sm text-mute">{t("discordNotConfigured")}</p>
        </section>
      )}

      {/* Other platforms */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-ink">{t("secCommunityLinks")}</h2>
        {available.filter((p) => p.id !== "discord").length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {available
              .filter((p) => p.id !== "discord")
              .map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-line bg-panel p-6 text-center transition-colors hover:border-accent"
                >
                  <div className="mb-3 text-4xl">{p.emoji}</div>
                  <div className="font-bold text-ink group-hover:text-accent">{p.name}</div>
                </a>
              ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-panel p-10 text-center text-sm text-mute">
            {t("comOthersSoon")}
          </div>
        )}
      </section>
    </div>
  );
}
