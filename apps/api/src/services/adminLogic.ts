import type { Permission, RoleName } from "@hotpursuit/types";
import { ROLE_RANK } from "@hotpursuit/types";
import { ALL_PERMISSIONS, ROLES } from "../config/rbac.js";
import { ApiError } from "../lib/errors.js";

/**
 * Pure, DB-free rules that back the Admin Management endpoints. Keeping these
 * isolated from Prisma/Express makes the authorization rules auditable and
 * unit-testable without a database.
 *
 * Core rule: a staff member may only manage accounts strictly below their own
 * rank, and only when they hold the required permission(s). Only an OWNER can
 * manage OWNER accounts. Nobody can grant a role equal to or higher than their
 * own — self-promotion is therefore impossible by construction.
 */

export interface Actor {
  /** Highest rank the actor holds (0 when no staff role). */
  rank: number;
  /** True when the actor resolves to an Owner (env bridge or DB OWNER role). */
  isOwner: boolean;
  /** Permissions the actor currently holds (effective). */
  permissions: Permission[];
}

/** Rank of a role name (0 when the string is not a known role). */
export function rankOf(role: RoleName | string | null | undefined): number {
  if (!role) return 0;
  return ROLE_RANK[role as RoleName] ?? 0;
}

/** Highest rank among a list of role names (0 when none). */
export function highestRank(roles: Array<RoleName | string>): number {
  return roles.reduce((max, r) => Math.max(max, rankOf(r)), 0);
}

/** Highest-privilege role held by a user (null when they have no staff role). */
export function primaryRole(roles: Array<RoleName | string>): RoleName | null {
  let best: RoleName | null = null;
  let bestRank = -1;
  for (const r of roles) {
    const rank = rankOf(r);
    if (rank > bestRank) {
      bestRank = rank;
      best = r as RoleName;
    }
  }
  return best;
}

/** Validate that a target role is a known role name. */
export function assertRole(role: unknown): asserts role is RoleName {
  if (typeof role !== "string" || !(ROLES as string[]).includes(role)) {
    throw ApiError.badRequest(
      "invalid_role",
      `Role must be one of: ${ROLES.join(", ")}.`,
    );
  }
}

/**
 * Validate a list of permission names. Only permission names that exist in the
 * backend RBAC configuration are accepted — a client can never invent a
 * permission (e.g. "self.promote").
 */
export function assertPermissions(perms: unknown): asserts perms is Permission[] {
  if (!Array.isArray(perms)) {
    throw ApiError.badRequest("invalid_permissions", "Permissions must be a list.");
  }
  const known = new Set<string>(ALL_PERMISSIONS);
  for (const p of perms) {
    if (typeof p !== "string" || !known.has(p)) {
      throw ApiError.badRequest(
        "invalid_permission",
        `Unknown permission: ${String(p)}.`,
      );
    }
  }
}

/** Require the actor to hold the `admins.manage` capability for management ops. */
export function requireAdminsManage(actor: Actor): void {
  if (!actor.permissions.includes("admins.manage")) {
    throw ApiError.forbidden("forbidden", "You do not have permission.");
  }
}

/**
 * True when the actor may manage an account whose highest role is `targetRank`.
 * - A non-staff target (rank 0) is always manageable (a fresh promotion).
 * - OWNER targets (rank 4) may only be managed by another Owner.
 * - Otherwise the actor must strictly outrank the target.
 */
export function canManageRank(actor: Actor, targetRank: number): boolean {
  if (targetRank === 0) return true; // target is not staff — fine to promote
  if (targetRank === rankOf("OWNER")) return actor.isOwner;
  return actor.rank > targetRank;
}

/**
 * Core gate used by add/change: the actor must be able to assign `role`.
 * - The actor must hold the ability to manage admins.
 * - The assigned role must be strictly below the actor's own rank.
 * - Assigning OWNER additionally requires the actor to be an Owner.
 */
export function canAssignRole(actor: Actor, role: RoleName): boolean {
  if (role === "OWNER") return actor.isOwner;
  return actor.rank > rankOf(role);
}

/** Reverse-change safety: the actor may demote a target to `toRank` only if they
 * outrank (or are an Owner managing) both the target's current role and the
 * new role. */
export function canChangeRole(
  actor: Actor,
  currentRole: RoleName | null,
  newRole: RoleName,
): boolean {
  if (currentRole === newRole) {
    // Same role — allow only if actor outranks it (idempotent edit).
    if (newRole === "OWNER") return actor.isOwner;
    return actor.rank > rankOf(newRole);
  }
  return (
    canAssignRole(actor, newRole) &&
    (currentRole === null || canManageRank(actor, rankOf(currentRole)))
  );
}

/**
 * Guard: prevent an OWNER from removing/demoting themselves if it would leave
 * no Owner with `admins.manage` authority. Only meaningful when targeting self.
 */
export function assertSafeOwnerRemoval(
  actor: Actor,
  isSelf: boolean,
  targetHighestRank: number,
  totalOwners: number,
  removingOwnership: boolean,
): void {
  if (!isSelf) return;
  if (removingOwnership && actor.isOwner && targetHighestRank === rankOf("OWNER")) {
    if (totalOwners <= 1) {
      throw ApiError.badRequest(
        "last_owner",
        "You cannot remove the last Owner. Assign another Owner first.",
      );
    }
  }
}

/** Permission diff helper: returns granted / revoked permission names. */
export function permissionDiff(
  current: Permission[],
  next: Permission[],
): { granted: Permission[]; revoked: Permission[] } {
  const cur = new Set(current);
  const nxt = new Set(next);
  return {
    granted: [...nxt].filter((p) => !cur.has(p)),
    revoked: [...cur].filter((p) => !nxt.has(p)),
  };
}
