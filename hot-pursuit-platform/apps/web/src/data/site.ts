/**
 * HOT PURSUIT RP — Site-level configuration (links, social, branding).
 *
 * Real production links MUST be supplied via environment variables or by
 * editing this file before launch. Empty values render as "coming soon"
 * instead of shipping fake or dead links.
 */

const env = import.meta.env as Record<string, string | undefined>;

export interface SiteLinks {
  /** Discord community invite. */
  discord: string;
  /** Discord channel/thread to open a purchase ticket. */
  discordTicket: string;
  /** Direct "connect to server" address (FiveM). */
  play: string;
  social: Record<"tiktok" | "youtube" | "instagram" | "twitter" | "twitch", string>;
}

const def = import.meta.env.DEV
  ? {
      // Development placeholders — replace with real values in production.
      discord: "",
      discordTicket: "",
      play: "",
      social: { tiktok: "", youtube: "", instagram: "", twitter: "", twitch: "" },
    }
  : {
      discord: env.VITE_DISCORD_URL ?? "",
      discordTicket: env.VITE_DISCORD_TICKET_URL ?? "",
      play: env.VITE_PLAY_URL ?? "",
      social: {
        tiktok: env.VITE_SOCIAL_TIKTOK ?? "",
        youtube: env.VITE_SOCIAL_YOUTUBE ?? "",
        instagram: env.VITE_SOCIAL_INSTAGRAM ?? "",
        twitter: env.VITE_SOCIAL_TWITTER ?? "",
        twitch: env.VITE_SOCIAL_TWITCH ?? "",
      },
    };

export const siteLinks: SiteLinks = def;

export const brand = {
  name: "HOT PURSUIT RP",
  tagline: "YOUR STORY. YOUR RULES.",
  logo: "/images/Asset_2.webp",
  logoFallbackText: "🚓",
} as const;
