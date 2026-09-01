import type { AdminUser, Permission, RoleName } from "@hotpursuit/types";
import { env } from "../config/env.js";
import { prisma } from "../database/client.js";
import { ApiError } from "../lib/errors.js";
import { discordAvatarUrl } from "./discord.js";
import { computeEffectivePermissions } from "./permissions.js";
import {
  canAssignRole,
  canChangeRole,
  canManageRank,
  primaryRole,
  rankOf,
  requireAdminsManage,
  type Actor,
} from "./adminLogic.js";

/** The staff roles that mark a User as an admin. */
export const STAFF_ROLES: RoleName[] = [
  "OWNER",
  "ADMIN",
  "MODERATOR",
  "CONTENT_MANAGER",
];

/** Build an Actor (rank / owner / permissions) from an AuthPrincipal. */
export function actorFromPrincipal(p: {
  access: { roles: RoleName[]; permissions: Permission[] };
}): Actor {
  const isOwner = p.access.roles.includes("OWNER");
  return {
    rank: p.access.roles.reduce(
      (max, r) => Math.max(max, rankOf(r)),
      0,
    ),
    isOwner,
    permissions: p.access.permissions,
  };
}

/** Highest staff role held by a user (or null). */
async function staffRolesOf(userId: string): Promise<RoleName[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows
    .map((r) => r.role.name as RoleName)
    .filter((n) => STAFF_ROLES.includes(n as RoleName));
}

/** Direct per-user permission grants. */
async function directGrantsOf(userId: string): Promise<Permission[]> {
  const rows = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  return rows.map((r) => r.permission.name as Permission);
}

/** Count of unique OWNER accounts: DB OWNER roles + env-bridged owners. */
export async function totalOwners(): Promise<number> {
  const envOwners = new Set(env.ownerDiscordIds);
  const dbOwners = (await prisma.user
    .findMany({
      where: { roles: { some: { role: { name: "OWNER" } } } },
      select: { discordId: true },
    })
    .catch(() => [])) as { discordId: string }[];
  const dbSet = new Set(dbOwners.map((u) => u.discordId));
  let count = dbOwners.length;
  for (const id of envOwners) {
    if (!dbSet.has(id)) count += 1;
  }
  return count;
}

/** Whether a discordId is an env-bridged owner (not editable via this API). */
function isEnvOwner(discordId: string): boolean {
  return env.ownerDiscordIds.includes(discordId);
}

/** Resolve the avatar URL for a user's DiscordAccount. */
async function avatarFor(userId: string): Promise<string | null> {
  const acc = await prisma.discordAccount.findUnique({
    where: { userId },
    select: { discordId: true, avatar: true, username: true },
  });
  if (!acc) return null;
  return acc.avatar
    ? discordAvatarUrl({ id: acc.discordId, avatar: acc.avatar, username: acc.username })
    : null;
}

/** Build a public AdminUser record (safe identifiers only). */
async function toAdminUser(
  user: { id: string; discordId: string; createdAt: Date },
  roles: RoleName[],
  directPermissions: Permission[],
  viaEnvBridge = false,
): Promise<AdminUser> {
  const disc = await prisma.discordAccount.findUnique({
    where: { userId: user.id },
    select: { username: true, globalName: true },
  });
  const effective = computeEffectivePermissions(roles, directPermissions);
  const record: AdminUser = {
    id: user.id,
    discordId: user.discordId,
    username: disc?.username ?? "",
    globalName: disc?.globalName ?? null,
    avatar: await avatarFor(user.id),
    roles,
    primaryRole: primaryRole(roles),
    permissions: effective,
    createdAt: user.createdAt.toISOString(),
  };
  if (viaEnvBridge) (record as AdminUser & { viaEnvBridge: true }).viaEnvBridge = true;
  return record;
}

/** GET /api/admins — staff users (DB roles) + env-bridged owners surfaced read-only. */
export async function listAdmins(): Promise<AdminUser[]> {
  const staffUsers = await prisma.user.findMany({
    where: { roles: { some: { role: { name: { in: STAFF_ROLES } } } } },
    orderBy: { createdAt: "asc" },
  });

  const out: AdminUser[] = [];
  const seenDiscord = new Set<string>();

  for (const u of staffUsers) {
    const roles = await staffRolesOf(u.id);
    const grants = await directGrantsOf(u.id);
    seenDiscord.add(u.discordId);
    out.push(await toAdminUser(u, roles, grants));
  }

  // Env-bridged owners not already in the DB list (read-only surface).
  for (const discordId of env.ownerDiscordIds) {
    if (seenDiscord.has(discordId)) continue;
    const user = await prisma.user.findUnique({ where: { discordId } });
    if (!user) continue;
    out.push(
      await toAdminUser(
        { id: user.id, discordId: user.discordId, createdAt: user.createdAt },
        ["OWNER"],
        [],
        true,
      ),
    );
  }

  return out;
}

/** POST /api/admins — promote an existing User to a staff role. */
export async function addAdmin(
  actor: Actor,
  actorUserId: string,
  input: { discordId: string; role: RoleName; permissions?: Permission[] },
): Promise<AdminUser> {
  requireAdminsManage(actor);
  if (!canAssignRole(actor, input.role)) {
    throw ApiError.forbidden(
      "cannot_assign_role",
      "You cannot assign a role at or above your own rank.",
    );
  }
  if (isEnvOwner(input.discordId)) {
    throw ApiError.conflict(
      "env_owner",
      "This account is already an Owner via server configuration.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { discordId: input.discordId },
  });
  if (!user) {
    throw ApiError.badRequest(
      "user_not_found",
      "No account with this Discord id has logged in yet. They must log in at least once before being promoted.",
    );
  }
  if (user.id === actorUserId) {
    throw ApiError.badRequest("self_promotion", "You cannot change your own role here.");
  }

  const currentRoles = await staffRolesOf(user.id);
  if (currentRoles.length) {
    throw ApiError.conflict("already_staff", "This account is already staff.");
  }

  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) throw ApiError.badRequest("invalid_role", "Unknown role.");

  const permissions = input.permissions ?? [];
  const permissionRows = (await prisma.permission.findMany({
    where: { name: { in: permissions } },
    select: { id: true },
  })) as { id: string }[];

  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  await Promise.all(
    permissionRows.map((p) =>
      prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: user.id, permissionId: p.id } },
        update: {},
        create: { userId: user.id, permissionId: p.id },
      }),
    ),
  );

  return toAdminUser(user, [input.role], permissions);
}

/** PATCH /api/admins/:id — change role and/or replace direct permission grants. */
export async function changeAdmin(
  actor: Actor,
  actorUserId: string,
  targetId: string,
  input: { role?: RoleName; permissions?: Permission[] },
): Promise<{ admin: AdminUser; changed: { role: boolean; permissions: boolean } }> {
  requireAdminsManage(actor);

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw ApiError.notFound("admin_not_found", "Staff account not found.");
  if (isEnvOwner(user.discordId)) {
    throw ApiError.conflict(
      "env_owner",
      "This Owner is managed by server configuration and cannot be edited here.",
    );
  }

  const currentRoles = await staffRolesOf(user.id);
  const currentRank = Math.max(0, ...currentRoles.map((r) => rankOf(r)));

  if (currentRank === 0) {
    throw ApiError.badRequest(
      "not_staff",
      "This account is not staff. Use the add endpoint to promote them.",
    );
  }

  let newRole: RoleName | null = null;
  let changedRole = false;

  if (input.role !== undefined && input.role !== currentRoles[0]) {
    if (!canChangeRole(actor, currentRoles[0] ?? null, input.role)) {
      throw ApiError.forbidden(
        "cannot_change_role",
        "You cannot change this staff member to that role.",
      );
    }
    // Last-owner protection: demoting an OWNER to a non-OWNER role must leave
    // at least one Owner in place.
    if (currentRoles.includes("OWNER") && input.role !== "OWNER") {
      const count = await totalOwners();
      if (count <= 1) {
        throw ApiError.badRequest(
          "last_owner",
          "You cannot demote the last Owner. Assign another Owner first.",
        );
      }
    }
    newRole = input.role;
    changedRole = true;
  }

  let changeGranted = false;
  if (input.permissions !== undefined) {
    changeGranted = true;
  }

  if (newRole) {
    const role = await prisma.role.findUnique({ where: { name: newRole } });
    if (!role) throw ApiError.badRequest("invalid_role", "Unknown role.");
    // Replace the single staff role.
    const currentRoleRows = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });
    await prisma.$transaction([
      ...currentRoleRows.map((r) =>
        prisma.userRole.delete({ where: { userId_roleId: { userId: user.id, roleId: r.roleId } } }),
      ),
      prisma.userRole.create({ data: { userId: user.id, roleId: role.id } }),
    ]);
  }

  if (changeGranted) {
    const wanted = input.permissions ?? [];
    const permissionRows = (await prisma.permission.findMany({
      where: { name: { in: wanted } },
      select: { id: true, name: true },
    })) as { id: string; name: Permission }[];
    await prisma.userPermission.deleteMany({ where: { userId: user.id } });
    await Promise.all(
      permissionRows.map((p) =>
        prisma.userPermission.create({ data: { userId: user.id, permissionId: p.id } }),
      ),
    );
    changeGranted = permissionRows.length > 0 || wanted.length === 0;
  }

  const finalRoles = await staffRolesOf(user.id);
  const finalGrants = await directGrantsOf(user.id);
  const admin = await toAdminUser(user, finalRoles, finalGrants);
  return {
    admin,
    changed: { role: changedRole, permissions: changeGranted },
  };
}

/** DELETE /api/admins/:id — demote/remove a staff member (owner-safe). */
export async function removeAdmin(
  actor: Actor,
  actorUserId: string,
  targetId: string,
): Promise<{ id: string; removed: boolean }> {
  requireAdminsManage(actor);

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw ApiError.notFound("admin_not_found", "Staff account not found.");
  if (isEnvOwner(user.discordId)) {
    throw ApiError.conflict(
      "env_owner",
      "This Owner is managed by server configuration and cannot be removed via the API.",
    );
  }

  const currentRoles = await staffRolesOf(user.id);
  const currentRank = Math.max(0, ...currentRoles.map((r) => rankOf(r)));
  if (currentRank === 0) {
    throw ApiError.badRequest("not_staff", "This account is not staff.");
  }

  const isSelf = user.id === actorUserId;
  const isOwnerTarget = currentRoles.includes("OWNER");

  // Owners may only be managed by owners; the actor must outrank the target.
  if (isOwnerTarget && !actor.isOwner) {
    throw ApiError.forbidden("cannot_remove_owner", "Only Owners can manage Owners.");
  }
  if (!canManageRank(actor, currentRank)) {
    throw ApiError.forbidden(
      "cannot_remove_higher",
      "You cannot remove a higher-rank staff member.",
    );
  }

  // Last-owner safety: an Owner demoting/removing themselves must leave an owner.
  if (isSelf && isOwnerTarget) {
    const count = await totalOwners();
    if (count <= 1) {
      throw ApiError.badRequest(
        "last_owner",
        "You cannot remove the last Owner. Assign another Owner first.",
      );
    }
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({
      where: { userId: user.id, role: { name: { in: STAFF_ROLES } } },
    }),
    prisma.userPermission.deleteMany({ where: { userId: user.id } }),
  ]);

  return { id: user.id, removed: true };
}
