import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { env, authConfigured } from "../config/env.js";
import { prisma } from "../database/client.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { authorizationCode, oauthState } from "../lib/validate.js";
import {
  exchangeAuthorizationCode,
  fetchDiscordUser,
} from "../services/discord.js";
import {
  getCurrentUser,
  requireAuth,
  serializeUser,
  type AuthPrincipal,
} from "../middleware/auth.js";

export const authRouter = Router();

/**
 * GET /api/auth/discord
 * Starts the OAuth flow. Sets a CSRF state nonce in the session, then redirects
 * to Discord. Runs entirely server-side (secret never reaches the browser).
 */
authRouter.get("/discord", (_req, res) => {
  if (!authConfigured()) {
    return res.status(503).json({
      error: "oauth_not_configured",
      message: "Login is not configured yet. Ask an admin to set Discord credentials.",
    });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = encodeURIComponent(env.discordRedirectUri!);
  const clientId = env.discordClientId!;

  // Persist the nonce so the callback can verify it (CSRF protection).
  const session = (res.req as Request).session;
  session.oauthState = state;

  const url =
    `https://discord.com/oauth2/authorize?` +
    `client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}` +
    `&scope=identify&state=${state}`;
  res.redirect(url);
});

/**
 * GET /api/auth/discord/callback
 * Validates the OAuth response, exchanges the code, upserts the User +
 * DiscordAccount, establishes a secure session, then redirects to the frontend.
 */
authRouter.get(
  "/discord/callback",
  asyncHandler(async (req: Request, res: Response) => {
    if (!authConfigured()) {
      throw ApiError.unauthorized(
        "oauth_not_configured",
        "Discord OAuth is not configured on the server.",
      );
    }

    const error = req.query.error;
    if (typeof error === "string") {
      throw ApiError.unauthorized("oauth_denied", "Discord login was cancelled.");
    }

    const code = authorizationCode(req.query.code);
    const state = oauthState(req.query.state);

    // Verify CSRF nonce matches the one we set at the start of the flow.
    if (req.session.oauthState !== state) {
      throw ApiError.badRequest("invalid_oauth_state", "OAuth state mismatch.");
    }
    req.session.oauthState = undefined;

    // Exhange the code (server-side, with the client secret).
    const token = await exchangeAuthorizationCode(code);
    const profile = await fetchDiscordUser(token.access_token);

    // Create or find the User (identity = server-verified Discord id; never
    // client-supplied proof).
    let user = await prisma.user.findUnique({
      where: { discordId: profile.id },
    });
    if (!user) {
      user = await prisma.user.create({ data: { discordId: profile.id } });
    }

    // Create/update the DiscordAccount (safe subset only).
    await prisma.discordAccount.upsert({
      where: { userId: user.id },
      update: {
        discordId: profile.id,
        username: profile.username,
        globalName: profile.globalName,
        avatar: profile.avatar,
      },
      create: {
        userId: user.id,
        discordId: profile.id,
        username: profile.username,
        globalName: profile.globalName,
        avatar: profile.avatar,
      },
    });

    // Establish the server-side session (only the User id is stored).
    req.session.userId = user.id;
    req.session.redirectTo = undefined;

    const target = env.clientOrigin;
    res.redirect(target);
  }),
);

/** GET /api/auth/me — current authenticated user (or 401). */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const principal = req.authUser as AuthPrincipal;
    const user = await serializeUser(principal);
    if (!user) throw ApiError.unauthorized();
    res.json({ user });
  }),
);

/** POST /api/auth/logout — destroy the server-side session. */
authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        throw ApiError.badRequest("logout_failed");
      }
      res.clearCookie("hp_session");
      res.json({ ok: true });
    });
  }),
);
