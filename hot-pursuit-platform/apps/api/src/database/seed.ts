import type { Permission } from "@hotpursuit/types";
import {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLES,
} from "../config/rbac.js";
import { prisma } from "./client.js";

/**
 * Seeds the role/permission foundation tables. This creates ONLY real system
 * roles (OWNER, ADMIN, MODERATOR, CONTENT_MANAGER) and their permission set.
 *
 * It deliberately does NOT create fake player/admin accounts and does NOT
 * assign any User a role — ownership is resolved server-side via
 * OWNER_DISCORD_IDS until Admin Management lands.
 *
 * Idempotent: safe to run repeatedly.
 */
export async function seed() {
  // Upsert permissions
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission },
      update: { description: PERMISSION_DESCRIPTIONS[permission] },
      create: {
        name: permission,
        description: PERMISSION_DESCRIPTIONS[permission],
      },
    });
  }

  // Upsert roles and link their default permissions
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role },
      update: { description: ROLE_DESCRIPTIONS[role] },
      create: {
        name: role,
        description: ROLE_DESCRIPTIONS[role],
        permissions: {
          connect: ROLE_DEFAULT_PERMISSIONS[role].map((p) => ({ name: p })),
        },
      },
    });
  }

  // Ensure each role's permission links match the defaults (idempotent sync)
  for (const role of ROLES) {
    const roleRow = await prisma.role.findUnique({
      where: { name: role },
      include: { permissions: true },
    });
    if (!roleRow) continue;
    const want = new Set<string>(ROLE_DEFAULT_PERMISSIONS[role]);
    const have = new Set(roleRow.permissions.map((p) => p.name));
    const toAdd = [...want].filter((p) => !have.has(p));
    const toRemove = roleRow.permissions
      .map((p) => p.name)
      .filter((p) => !want.has(p));
    if (toAdd.length) {
      await prisma.role.update({
        where: { name: role },
        data: {
          permissions: { connect: toAdd.map((p) => ({ name: p as Permission })) },
        },
      });
    }
    if (toRemove.length) {
      await prisma.role.update({
        where: { name: role },
        data: {
          permissions: {
            disconnect: toRemove.map((p) => ({ name: p as Permission })),
          },
        },
      });
    }
  }
}

// Allow running directly: `npm run db:seed` / `npx tsx src/database/seed.ts`
if (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js")) {
  seed()
    .then(() => {
      console.log("[seed] roles and permissions synced.");
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("[seed] failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
