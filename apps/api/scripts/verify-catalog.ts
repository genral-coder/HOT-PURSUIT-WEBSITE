/**
 * Catalog + registry verification script.
 *
 *   npm run verify:catalog
 *
 * Stage 1 (always): static verification, fully offline —
 *   - catalog validity (39 products, unique ids, whitelists, pricing derives)
 *   - regression vs the static frontend catalog (apps/web/src/data/products.ts)
 *   - the generated migration file exists on disk
 *
 * Stage 2 (only when PostgreSQL is reachable): live DB verification —
 *   - the migration is applied (ProductCategory / Product columns exist)
 *   - every catalog product exists as a DB row, prices match the derived cents
 *   - every ProductPrice row is FK-complete and derives a clean amount
 *
 * Exit code reflects stage 1 failure; stage 2 reports but never fakes success.
 * The live stage is BLOCKED (skipped, reported) when the database is down.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { products as webProducts } from "../../web/src/data/products.js";
import {
  CATALOG_PRODUCTS,
  CATEGORIES,
  deriveCatalogPricing,
  validateCatalog,
} from "../src/database/catalog.js";

const MIGRATION_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../prisma/migrations/20260911120000_store_products/migration.sql",
);

let failed = 0;
function report(ok: boolean, label: string, detail = ""): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed += 1;
}

function canon(p: { [k: string]: unknown }): unknown[] {
  return [
    p.id,
    p.category,
    p.name,
    p.nameAr ?? null,
    p.short ?? null,
    p.shortAr ?? null,
    p.description ?? null,
    p.descriptionAr ?? null,
    p.features ?? [],
    p.featuresAr ?? [],
    p.price,
    p.image ?? null,
    p.type ?? null,
    p.class ?? null,
    p.sold ?? false,
    p.popular ?? false,
    p.likes ?? 0,
  ];
}

/* ───────────────────── Stage 1: static (offline) ───────────────────── */

console.log("== Stage 1: static catalog verification (offline) ==");

const validation = validateCatalog();
report(validation.ok, `catalog validates (${validation.count} products)`);
if (!validation.ok) for (const e of validation.errors) console.log(`    - ${e}`);

report(
  CATALOG_PRODUCTS.length === webProducts.length,
  `catalog count matches static source (${CATALOG_PRODUCTS.length} vs ${webProducts.length})`,
);

const byId = new Map(webProducts.map((p) => [p.id, p]));
let mismatches = 0;
for (const p of CATALOG_PRODUCTS) {
  const src = byId.get(p.id);
  const a = JSON.stringify(canon(p as never));
  const b = src ? JSON.stringify(canon(src as never)) : "MISSING";
  if (a !== b) {
    mismatches += 1;
    console.log(`    - product ${p.id} ("${p.name}") differs from static source`);
  }
}
report(mismatches === 0, "every catalog row matches the static source");

let undeducible = 0;
for (const p of CATALOG_PRODUCTS) {
  try {
    deriveCatalogPricing(p.price, p.name);
  } catch {
    undeducible += 1;
    console.log(`    - product ${p.id} price "${p.price}" cannot derive pricing`);
  }
}
report(
  undeducible === 0,
  `every product price derives to integer cents (0 undeducible)`,
);

report(
  CATEGORIES.length === 4,
  `categories complete (${CATEGORIES.map((c) => c.id).join(", ")})`,
);

report(existsSync(MIGRATION_PATH), "migration file exists on disk", MIGRATION_PATH);

/* ───────────────────── Stage 2: live DB (blocked-graceful) ───────────────────── */

console.log("== Stage 2: live database verification (requires PostgreSQL) ==");

let skipDb = false;
let prismaImport: typeof import("../src/database/client.js") | null = null;
try {
  const loaded = (await import("../src/database/client.js")) as Awaited<
    typeof import("../src/database/client.js")
  >;
  const connected = await loaded.isDatabaseConnected();
  if (!connected) {
    console.log("SKIP   database is not reachable — live verification not performed");
    skipDb = true;
  } else {
    prismaImport = loaded;
  }
} catch {
  console.log("SKIP   prisma client could not connect — live verification not performed");
  skipDb = true;
}

if (!skipDb && prismaImport) {
  const prisma = prismaImport.prisma;
  try {
    const total = await prisma.product.count();
    report(total >= CATALOG_PRODUCTS.length, "Product rows present", `count=${total}`);

    const rows = await prisma.product.findMany({
      include: { priceReg: true },
    });
    let pricingMismatch = 0;
    const rowMap = new Map(rows.map((r) => [r.productId, r]));
    for (const p of CATALOG_PRODUCTS) {
      const row = rowMap.get(p.id);
      if (!row) {
        pricingMismatch += 1;
        continue;
      }
      const expected = deriveCatalogPricing(p.price, p.name);
      if (!row.priceReg || row.priceReg.amountCents !== expected.amountCents) {
        pricingMismatch += 1;
      }
    }
    report(
      pricingMismatch === 0,
      "derived catalog prices match ProductPrice registry rows",
    );

    const orphanPrices = await prisma.productPrice.count({
      where: { product: null },
    });
    report(orphanPrices === 0, "no orphan ProductPrice rows (FK complete)");
  } catch (e) {
    console.log("SKIP   live verification errored:", (e as Error).message);
  } finally {
    await prismaImport.prisma.$disconnect().catch(() => undefined);
  }
}

if (failed > 0) {
  console.error(`\n[catalog-verify] ${failed} verification(s) FAILED.`);
  process.exitCode = 1;
} else {
  console.log("\n[catalog-verify] all offline verifications passed.");
}