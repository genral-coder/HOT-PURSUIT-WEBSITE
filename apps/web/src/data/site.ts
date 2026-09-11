/**
 * HOT PURSUIT RP — Site-level configuration (links, social, branding, SEO).
 *
 * Real production links are supplied here (migrated verbatim from the legacy
 * site-config.js). They can still be overridden via Vite env vars (VITE_*) for
 * staging/deployment. Empty values render as "coming soon" instead of shipping
 * fake or dead links.
 */

const env = import.meta.env as Record<string, string | undefined>;

export interface SiteLinks {
  /** Discord community invite. */
  discord: string;
  /** Discord channel/thread to open a purchase or support ticket. */
  discordTicket: string;
  /** Direct "connect to server" address (FiveM). */
  play: string;
  social: Record<"tiktok" | "youtube" | "instagram" | "twitter" | "twitch", string>;
}

/**
 * Real values migrated from the legacy site-config.js. Env vars (VITE_*)
 * override these when present (e.g. for staging or a different invite).
 */
const defaults: SiteLinks = {
  discord: "https://discord.gg/REqWKXnrku",
  discordTicket: "discord://-/channels/1341426480827203584/1341516123123744881",
  play: "",
  social: {
    tiktok: "",
    youtube: "",
    instagram: "",
    twitter: "",
    twitch: "",
  },
};

export const siteLinks: SiteLinks = {
  discord: env.VITE_DISCORD_URL ?? defaults.discord,
  discordTicket: env.VITE_DISCORD_TICKET_URL ?? defaults.discordTicket,
  play: env.VITE_PLAY_URL ?? defaults.play,
  social: {
    tiktok: env.VITE_SOCIAL_TIKTOK ?? defaults.social.tiktok,
    youtube: env.VITE_SOCIAL_YOUTUBE ?? defaults.social.youtube,
    instagram: env.VITE_SOCIAL_INSTAGRAM ?? defaults.social.instagram,
    twitter: env.VITE_SOCIAL_TWITTER ?? defaults.social.twitter,
    twitch: env.VITE_SOCIAL_TWITCH ?? defaults.social.twitch,
  },
};

export const brand = {
  name: "HOT PURSUIT RP",
  tagline: "YOUR STORY. YOUR RULES.",
  logo: "/images/Asset_2.webp",
  logoFallbackText: "🚓",
} as const;

/**
 * SEO / Open Graph metadata per page. The real HOT PURSUIT branding is used;
 * page-specific values are set by each page (see usePageMeta). This is the
 * site-wide default.
 */
export const seo = {
  siteName: "HOT PURSUIT RP",
  title: "HOT PURSUIT RP | FiveM Roleplay Server",
  description:
    "A premium FiveM roleplay experience where your choices shape your story. Create your story, live by your rules.",
  url: "https://genral-coder.github.io/HOT-PURSUIT-WEBSITE/",
  image: "/images/Asset_2.webp",
  twitterCard: "summary_large_image",
  themeColor: "#0b0b0e",
} as const;
