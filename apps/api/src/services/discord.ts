import { env } from "../config/env.js";
import { ApiError } from "../lib/errors.js";

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Safe subset of a Discord user we persist. */
export interface DiscordProfile {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

/**
 * Exchange a Discord OAuth authorization code for an access token.
 * This runs server-side using the client secret — the secret never leaves the
 * backend.
 */
export async function exchangeAuthorizationCode(
  code: string,
): Promise<DiscordTokenResponse> {
  if (!env.discordClientId || !env.discordClientSecret || !env.discordRedirectUri) {
    throw ApiError.unauthorized(
      "oauth_not_configured",
      "Discord OAuth is not configured on the server.",
    );
  }

  const params = new URLSearchParams({
    client_id: env.discordClientId,
    client_secret: env.discordClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.discordRedirectUri,
  });

  let res: Response;
  try {
    res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch {
    throw ApiError.unauthorized("oauth_failed", "Discord is temporarily unavailable.");
  }

  if (!res.ok) {
    throw ApiError.unauthorized("oauth_failed", "Discord rejected the authorization code.");
  }

  return (await res.json()) as DiscordTokenResponse;
}

/**
 * Fetch the authenticated Discord user profile for a Bearer access token.
 * Returns only the safe subset we need (id, username, globalName, avatar).
 */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordProfile> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw ApiError.unauthorized("discord_profile_failed", "Could not fetch Discord profile.");
  }
  const raw = (await res.json()) as {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };
  return {
    id: raw.id,
    username: raw.username,
    globalName: raw.global_name ?? null,
    avatar: raw.avatar ?? null,
  };
}

/** Build a Discord CDN avatar URL (undefined when no avatar is set). */
export function discordAvatarUrl(profile: {
  id: string;
  avatar: string | null;
  username: string;
}): string | null {
  if (!profile.avatar) return null;
  const ext = profile.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${ext}?size=128`;
}
