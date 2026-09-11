import type { Permission } from "@hotpursuit/types";
import {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLES,
} from "../config/rbac.js";
import { prisma } from "./client.js";
import { CATALOG_PRODUCTS, CATEGORIES, deriveCatalogPricing, validateCatalog } from "./catalog.js";

/**
 * Seeds the role/permission foundation tables. This creates ONLY real system
 * roles (OWNER, ADMIN, MODERATOR, CONTENT_MANAGER) and their permission set.
 *
 * It deliberately does NOT create fake player/admin accounts and does NOT
 * assign any User a role — ownership is resolved server-side via
 * OWNER_DISCORD_IDS until Admin Management lands.
 *
 * Phase 7: the Store catalog and ProductCategory reference data are seeded
 * from src/database/catalog.ts (the single verified source), and the trusted
 * ProductPrice registry rows are DERIVED from it with deriveCatalogPricing —
 * one upsert per product, amounts in integer cents, `available` = not sold AND
 * not archived. The registry therefore always mirrors the catalog.
 *
 * Idempotent: safe to run repeatedly. Never deletes anything.
 */
export async function seed() {
  const validation = validateCatalog();
  if (!validation.ok) {
    throw new Error(
      `[seed] catalog validation failed:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

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

  // Phase 7: seed the canonical catalog + reference categories, then derive
  // the trusted pricing registry from it. Order matters — ProductPrice rows
  // FK to Product(productId).
  await seedCatalog();
  await seedProductPrices();
}

/**
 * Upsert the ProductCategory reference rows and the Product catalog from
 * src/database/catalog.ts (the single verified source).
 *
 * IMPORTANT: on update the `available` flag is deliberately NOT touched, so
 * admin archives/restores survive re-seeding. Catalog-only fields (name,
 * price, features, ...) do get re-synced so the migration source stays
 * authoritative for catalog CONTENT, never for lifecycle state.
 */
export async function seedCatalog(): Promise<void> {
  for (const cat of CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        nameAr: cat.nameAr,
        emoji: cat.emoji,
        color: cat.color,
      },
      create: {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr,
        emoji: cat.emoji,
        color: cat.color,
      },
    });
  }

  for (const p of CATALOG_PRODUCTS) {
    await prisma.product.upsert({
      where: { productId: p.id },
      update: {
        categoryId: p.category,
        name: p.name,
        nameAr: p.nameAr ?? null,
        short: p.short ?? null,
        shortAr: p.shortAr ?? null,
        description: p.description ?? null,
        descriptionAr: p.descriptionAr ?? null,
        features: p.features ?? [],
        featuresAr: p.featuresAr ?? [],
        price: p.price,
        image: p.image ?? null,
        type: p.type ?? null,
        class: p.class ?? null,
        sold: p.sold,
        popular: p.popular,
        likes: p.likes ?? 0,
      },
      create: {
        productId: p.id,
        categoryId: p.category,
        name: p.name,
        nameAr: p.nameAr ?? null,
        short: p.short ?? null,
        shortAr: p.shortAr ?? null,
        description: p.description ?? null,
        descriptionAr: p.descriptionAr ?? null,
        features: p.features ?? [],
        featuresAr: p.featuresAr ?? [],
        price: p.price,
        image: p.image ?? null,
        type: p.type ?? null,
        class: p.class ?? null,
        sold: p.sold,
        popular: p.popular,
        likes: p.likes ?? 0,
        available: true,
      },
    });
  }
}

/**
 * Server-side ProductPrice rows DERIVED from the verified catalog. Amounts are
 * integer cents (deriveCatalogPricing); `available` mirrors the catalog's
 * `sold` flag AND the stored archive flag, so sold-out or archived products
 * cannot be ordered. These rows are the ONLY source the orders API trusts.
 *
 * Registry alignment note: legacy seeds carried hand-typed name/nameAr/image
 * for the price rows. Those now come straight from the catalog, so any drift
 * between the frontend catalog and the registry is resolved AT THE REGISTRY by
 * design (the catalog is the single source of truth for both).
 *
 * Admin-created product price rows are intentionally NOT touched.
 */
export async function seedProductPrices(): Promise<void> {
  const stored = await prisma.product.findMany({
    select: { productId: true, available: true, sold: true },
  });
  const available = new Map<number, boolean>(
    stored.map((s) => [s.productId, !s.sold && s.available]),
  );

  for (const p of CATALOG_PRODUCTS) {
    const { amountCents, billing } = deriveCatalogPricing(p.price, p.name);
    const isAvailable = available.get(p.id) ?? false;
    await prisma.productPrice.upsert({
      where: { productId: p.id },
      update: {
        name: p.name,
        nameAr: p.nameAr ?? null,
        image: p.image ?? null,
        amountCents,
        billing,
        available: isAvailable,
      },
      create: {
        productId: p.id,
        name: p.name,
        nameAr: p.nameAr ?? null,
        image: p.image ?? null,
        amountCents,
        billing,
        available: isAvailable,
      },
    });
  }
}

// Allow running directly: `npm run db:seed` / `npx tsx src/database/seed.ts`
if (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js")) {
  seed()
    .then(() => {
      console.log("[seed] roles, permissions, catalog and product prices synced.");
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("[seed] failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}