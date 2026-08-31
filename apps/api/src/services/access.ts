import type { Permission, RoleName } from "@hotpursuit/types";
import { env } from "../config/env.js";
import { prisma } from "../database/client.js";
import {
  computeEffectivePermissions,
  ownerAccess,
} from "./permissions.js";

export interface ResolvedAccess {
  roles: RoleName[];
  permissions: Permission[];
}

/**
 * Resolve the effective roles + permissions for a Discord id.
 *
 * The Owner bridge: Discord ids listed in OWNER_DISCORD_IDS (server-side env)
 * are granted OWNER with full permissions regardless of the database. This is a
 * development-phase bridge; future Admin Management moves ownership into
 * PostgreSQL. A user can never grant themselves Owner — the source is only
 * server config or an admin-authorised database role.
 */
export async function resolveAccess(
  discordId: string,
  userRowId?: string,
): Promise<ResolvedAccess> {
  if (env.ownerDiscordIds.includes(discordId)) {
    return ownerAccess();
  }

  let roles: RoleName[] = [];
  let directGrants: Permission[] = [];

  if (userRowId) {
    const user = await prisma.user.findUnique({
      where: { id: userRowId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        permissions: { include: { permission: true } },
      },
    });

    if (user) {
      roles = user.roles.map((r) => r.role.name as RoleName);
      directGrants = user.permissions.map((u) => u.permission.name as Permission);
    }
  }

  return { roles, permissions: computeEffectivePermissions(roles, directGrants) };
}

/** Whether a permission list satisfies a required permission. */
export function hasPermission(
  permissions: Permission[],
  required: Permission,
): boolean {
  return permissions.includes(required);
}
