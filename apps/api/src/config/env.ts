import "dotenv/config";

export interface Env {
  port: number;
  nodeEnv: string;
  clientOrigin: string;
  /** Discord OAuth (populated in a later phase). */
  discordClientId?: string;
  discordClientSecret?: string;
  discordRedirectUri?: string;
  sessionSecret?: string;
  databaseUrl?: string;
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const env: Env = {
  port: int(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
  discordRedirectUri: process.env.DISCORD_REDIRECT_URI,
  sessionSecret: process.env.SESSION_SECRET,
  databaseUrl: process.env.DATABASE_URL,
};

export const isProd = env.nodeEnv === "production";
