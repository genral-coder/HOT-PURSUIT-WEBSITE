import "dotenv/config";

export interface Env {
  port: number;
  nodeEnv: string;
  isProd: boolean;
  /** Allowed frontend origin (CORS + OAuth redirect target). */
  clientOrigin: string;

  /* Discord OAuth2 (server-side only — never exposed to the client). */
  discordClientId?: string;
  discordClientSecret?: string;
  discordRedirectUri?: string;

  /* Session / cookie security. */
  sessionSecret?: string;
  /** Force Secure cookies. In production this is enabled by default. */
  sessionSecure: boolean;
  sessionSameSite: "lax" | "none" | "strict";
  cookieDomain?: string;
  /** Session lifetime in milliseconds. */
  sessionMaxAgeMs: number;

  /* PostgreSQL. */
  databaseUrl?: string;

  /**
   * Server-side Owner authorization. Comma-separated Discord user ids.
   * Owners are resolved ONLY here (never trusted from the client). This is a
   * development-phase bridge until admin management moves into PostgreSQL.
   */
  ownerDiscordIds: string[];
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function boolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function parseOwnerIds(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProd = nodeEnv === "production";

export const env: Env = {
  port: int(process.env.PORT, 4000),
  nodeEnv,
  isProd,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
  discordRedirectUri: process.env.DISCORD_REDIRECT_URI,

  sessionSecret: process.env.SESSION_SECRET,
  // Production defaults to Secure cookies; development does not (no HTTPS).
  sessionSecure: boolean(process.env.SESSION_SECURE, isProd),
  sessionSameSite: (process.env.SESSION_SAMESITE as Env["sessionSameSite"]) ??
    (isProd ? "none" : "lax"),
  cookieDomain: process.env.COOKIE_DOMAIN,
  sessionMaxAgeMs: int(process.env.SESSION_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000),

  databaseUrl: process.env.DATABASE_URL,

  ownerDiscordIds: parseOwnerIds(process.env.OWNER_DISCORD_IDS),
};

/**
 * True when the required server-side secrets are configured. The API can still
 * boot without them (health works, auth endpoints return friendly errors) so
 * the app degrades gracefully during local development.
 */
export function authConfigured(): boolean {
  return Boolean(
    env.discordClientId &&
      env.discordClientSecret &&
      env.discordRedirectUri &&
      env.sessionSecret,
  );
}
