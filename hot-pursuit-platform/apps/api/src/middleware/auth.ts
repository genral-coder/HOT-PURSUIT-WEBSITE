import type { NextFunction, Request, Response } from "express";
import type { Permission, RoleName } from "@hotpursuit/types";
import { prisma } from "../database/client.js";
import { ApiError } from "../lib/errors.js";
import { resolveAccess, type ResolvedAccess } from "../services/access.js";
import { discordAvatarUrl } from "../services/discord.js";

// Augment Express Request with the authenticated principal (set by requireAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthPrincipal;
    }
  }
}

export interface AuthPrincipal {
  userId: string;
  discordId: string;
  access: ResolvedAccess;
}

/** Reads the current user principal from a request (undefined when unauthenticated). */
export async function getCurrentUser(
  req: Request,
): Promise<AuthPrincipal | undefined> {
  if (req.session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (user) {
      const access = await resolveAccess(user.discordId, user.id);
      return { userId: user.id, discordId: user.discordId, access };
    }
  }
  return undefined;
}

/**
 * Reject unauthenticated requests with 401. Identity always comes from the
 * server-side session — never from client-supplied fields.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const principal = await getCurrentUser(req);
    if (!principal) {
      throw ApiError.unauthorized("auth_required", "You must be logged in.");
    }
    req.authUser = principal;
    next();
  } catch (e) {
    next(e);
  }
}

/** Require the user to have a role. Roles are granted server-side. */
export function requireRole(...roles: RoleName[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const principal = req.authUser ?? (await getCurrentUser(req));
      if (!principal) {
        throw ApiError.unauthorized("auth_required", "You must be logged in.");
      }
      const ok = principal.access.roles.some((r) => roles.includes(r));
      if (!ok) {
        throw ApiError.forbidden("forbidden", "You do not have permission.");
      }
      req.authUser = principal;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Require the user to hold a specific permission (server-enforced). */
export function requirePermission(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const principal = req.authUser ?? (await getCurrentUser(req));
      if (!principal) {
        throw ApiError.unauthorized("auth_required", "You must be logged in.");
      }
      if (!principal.access.permissions.includes(permission)) {
        throw ApiError.forbidden("forbidden", "You do not have permission.");
      }
      req.authUser = principal;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Serialize an authenticated user for API responses. Only exposes UI-relevant
 * data; the real authorization decision stays server-side.
 */
export async function serializeUser(principal: AuthPrincipal) {
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    include: { discordAccount: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    discord: {
      id: user.discordId,
      username: user.discordAccount?.username ?? "",
      globalName: user.discordAccount?.globalName ?? null,
      avatar: user.discordAccount?.avatar
        ? discordAvatarUrl({
            id: user.discordAccount.discordId,
            avatar: user.discordAccount.avatar,
            username: user.discordAccount.username,
          })
        : null,
      verified: true,
    },
    roles: principal.access.roles,
    permissions: principal.access.permissions,
    createdAt: user.createdAt.toISOString(),
  };
}
