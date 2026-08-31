import type { Permission, RoleName } from "@hotpursuit/types";
import { ROLE_DEFAULT_PERMISSIONS } from "../config/rbac.js";

/**
 * Pure role/permission resolution — no DB access, easy to test in isolation.
 * Used by `services/access.ts` to assemble a user's effective permissions and
 * by the seed to determine the defaults. Keeping this pure makes the
 * authorization rules auditable and unit-testable.
 */

/** Permissions granted by holding a set of roles (role defaults only). */
export function permissionsFromRoles(roles: RoleName[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_DEFAULT_PERMISSIONS[role] ?? []) {
      set.add(p);
    }
  }
  return [...set];
}

/**
 * Effective permissions for a user = role defaults ∪ direct grants, deduped.
 */
export function computeEffectivePermissions(
  roles: RoleName[],
  directGrants: Permission[] = [],
): Permission[] {
  const set = new Set<Permission>([...permissionsFromRoles(roles), ...directGrants]);
  return [...set];
}

/** Whether a permission set permits `required` (used by middleware). */
export function permits(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

/**
 * Owner bridge. An Owner has full access irrespective of the database. This is
 * the ONLY place Owner is derived, and it comes from server config — a client
 * can never self-assert it.
 */
export function ownerAccess(): { roles: RoleName[]; permissions: Permission[] } {
  return {
    roles: ["OWNER"],
    permissions: [...ROLE_DEFAULT_PERMISSIONS.OWNER],
  };
}
