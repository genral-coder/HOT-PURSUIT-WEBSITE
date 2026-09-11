import { Router } from "express";
import type { Request, Response } from "express";
import type { Permission, RoleName } from "@hotpursuit/types";
import { prisma } from "../database/client.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { str } from "../lib/validate.js";
import { requireAuth, requirePermission, type AuthPrincipal } from "../middleware/auth.js";
import { assertRole, assertPermissions } from "../services/adminLogic.js";
import {
  actorFromPrincipal,
  addAdmin,
  changeAdmin,
  listAdmins,
  removeAdmin,
  totalOwners,
} from "../services/admins.js";
import { recordAudit } from "../services/audit.js";
import { ALL_PERMISSIONS, ROLES } from "../config/rbac.js";
import { isDatabaseConnected } from "../database/client.js";

export const adminsRouter = Router();

// Every admin route requires an authenticated user.
adminsRouter.use(requireAuth);

/** Validate and parse a numeric Discord user id from input. */
function discordId(value: unknown): string {
  const s = str(value as string, { name: "discordId", min: 17, max: 20 })
    .replace(/\s+/g, "");
  if (!/^\d+$/.test(s)) {
    throw ApiError.badRequest("invalid_discord_id", "Discord id must be numeric.");
  }
  return s;
}

/** GET /api/admins — list staff accounts (admins.manage). */
adminsRouter.get(
  "/",
  requirePermission("admins.manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    const list = await listAdmins();
    res.json({ admins: list });
  }),
);

/** GET /api/admins/summary — only REAL backend-backed metrics. */
adminsRouter.get(
  "/summary",
  requirePermission("admin.access"),
  asyncHandler(async (_req: Request, res: Response) => {
    const db = await isDatabaseConnected();
    let users = 0;
    let staff = 0;
    if (db) {
      users = await prisma.user.count().catch(() => 0);
      staff = (await listAdmins()).length;
    }
    res.json({
      database: db ? "connected" : "unavailable",
      users,
      staff,
      owners: db ? await totalOwners().catch(() => 0) : 0,
      store: "coming-soon",
      orders: "coming-soon",
      applications: "coming-soon",
      tickets: "coming-soon",
      players: "coming-soon",
    });
  }),
);

/** GET /api/admins/meta — known roles + permissions (for the management UI). */
adminsRouter.get(
  "/meta",
  requirePermission("admins.manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ roles: ROLES, permissions: ALL_PERMISSIONS });
  }),
);

/** POST /api/admins — promote a user to a staff role. */
adminsRouter.post(
  "/",
  requirePermission("admins.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const principal = req.authUser as AuthPrincipal;
    const role = req.body.role as unknown;
    assertRole(role);
    const permissions = req.body.permissions;
    if (permissions !== undefined) assertPermissions(permissions);

    const admin = await addAdmin(
      actorFromPrincipal(principal),
      principal.userId,
      {
        discordId: discordId(req.body.discordId),
        role,
        permissions: (permissions ?? []) as Permission[],
      },
    );

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "ADMIN_ADDED",
      targetUser: admin.id,
      targetResource: admin.discordId,
      metadata: { role, permissions: permissions ?? [] },
    });

    res.status(201).json({ admin });
  }),
);

/** PATCH /api/admins/:id — change role and/or replace direct permission grants. */
adminsRouter.patch(
  "/:id",
  requirePermission("admins.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const principal = req.authUser as AuthPrincipal;
    const id = str(req.params.id, { name: "id" });

    const input: { role?: RoleName; permissions?: Permission[] } = {};
    if (req.body.role !== undefined) {
      const role = req.body.role as unknown;
      assertRole(role);
      input.role = role;
    }
    if (req.body.permissions !== undefined) {
      assertPermissions(req.body.permissions);
      input.permissions = req.body.permissions as Permission[];
    }

    const result = await changeAdmin(
      actorFromPrincipal(principal),
      principal.userId,
      id,
      input,
    );

    if (result.changed.role) {
      void recordAudit({
        actorUser: principal.userId,
        actorRole: principal.access.roles[0] ?? null,
        action: "ROLE_CHANGED",
        targetUser: id,
        targetResource: req.body.role as string,
        metadata: { role: req.body.role },
      });
    }
    if (result.changed.permissions) {
      void recordAudit({
        actorUser: principal.userId,
        actorRole: principal.access.roles[0] ?? null,
        action: "PERMISSION_CHANGED",
        targetUser: id,
        metadata: { permissions: req.body.permissions ?? [] },
      });
    }

    res.json({ admin: result.admin });
  }),
);

/** DELETE /api/admins/:id — remove a staff member (owner-safe). */
adminsRouter.delete(
  "/:id",
  requirePermission("admins.manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const principal = req.authUser as AuthPrincipal;
    const id = str(req.params.id, { name: "id" });

    const result = await removeAdmin(
      actorFromPrincipal(principal),
      principal.userId,
      id,
    );

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "ADMIN_REMOVED",
      targetUser: id,
    });

    res.json(result);
  }),
);
