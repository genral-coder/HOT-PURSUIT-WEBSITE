/**
 * Generates the Phase 7 store migration SQL from the verified catalog source
 * (src/database/catalog.ts). Run before migrating:
 *
 *   npm run db:generate-products-migration
 *
 * The generator FAILS loudly (exit 1) if the catalog is invalid — the process
 * never creates a migration from unverified data. This keeps the migration
 * deterministic: the committed SQL is always a transcription of the single
 * verified source, never hand-edited numbers.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG_PRODUCTS, CATEGORIES, validateCatalog } from "../src/database/catalog.js";

const MIGRATION_NAME = "20260911120000_store_products";

/** Single-quote for SQL string literals. */
function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Postgres TEXT[] literal from a string array. */
function sqlTextArray(values: string[] | undefined): string {
  if (!values || values.length === 0) return "'{}'::TEXT[]";
  return `ARRAY[${values.map((v) => sqlStr(v)).join(", ")}]::TEXT[]`;
}

function productInsertSQL(): string {
  const rows = CATALOG_PRODUCTS.map((p) => {
    const cols: string[] = [];
    cols.push(sqlStr(`prod_${p.id}`)); // id (deterministic PK)
    cols.push(String(p.id)); // productId
    cols.push(sqlStr(p.category)); // categoryId
    cols.push(sqlStr(p.name));
    p.nameAr !== undefined ? cols.push(sqlStr(p.nameAr)) : cols.push("NULL");
    p.short !== undefined ? cols.push(sqlStr(p.short)) : cols.push("NULL");
    p.shortAr !== undefined ? cols.push(sqlStr(p.shortAr)) : cols.push("NULL");
    p.description !== undefined ? cols.push(sqlStr(p.description)) : cols.push("NULL");
    p.descriptionAr !== undefined && p.descriptionAr.length
      ? cols.push(sqlStr(p.descriptionAr))
      : cols.push("NULL");
    cols.push(sqlTextArray(p.features));
    cols.push(sqlTextArray(p.featuresAr));
    cols.push(sqlStr(p.price));
    p.image && p.image.length ? cols.push(sqlStr(p.image)) : cols.push("NULL");
    p.type ? cols.push(sqlStr(p.type)) : cols.push("NULL");
    p.class ? cols.push(sqlStr(p.class)) : cols.push("NULL");
    cols.push(p.sold ? "true" : "false");
    cols.push(p.popular ? "true" : "false");
    cols.push(p.likes !== undefined ? String(p.likes) : "0");
    return `  (${cols.join(", ")})`;
  });
  return rows.join(",\n");
}

function buildSQL(): string {
  const catRows = CATEGORIES.map(
    (c) =>
      `  (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.nameAr)}, ${sqlStr(c.emoji)}, ${sqlStr(c.color)})`,
  ).join(",\n");

  return `------ BEGIN: HOT PURSUIT RP - Phase 7 (Store catalog + Admin products) ------

-- Generated deterministically by scripts/generate-store-migration.ts from
-- src/database/catalog.ts (the verified Store catalog source, 39 products).
-- Do not hand-edit the data — re-run the generator instead.

-- Table: ProductCategory
-- Reference data for the catalog categories (vehicles / mlo / vip / bundles).
-- Frontend display metadata continues to live in apps/web/src/data/store.ts;
-- this table anchors category identity for server-side validation.

CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProductCategory" ("id", "name", "nameAr", "emoji", "color") VALUES
${catRows};

-- Table: Product
-- The canonical Store catalog. productId keeps the legacy numeric id.
-- available=false = archived/hidden (soft delete — never a hard delete).
-- Text arrays hold the localized feature bullets.

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "short" TEXT,
    "shortAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "features" TEXT[] NOT NULL DEFAULT '{}',
    "featuresAr" TEXT[] NOT NULL DEFAULT '{}',
    "price" TEXT NOT NULL,
    "image" TEXT,
    "type" TEXT,
    "class" TEXT,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "new" BOOLEAN DEFAULT false,
    "featured" BOOLEAN DEFAULT false,
    "likes" INTEGER DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_available_idx" ON "Product"("available");
CREATE INDEX "Product_sold_idx" ON "Product"("sold");
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- Reference catalog data (verbatim from the verified Store source).
INSERT INTO "Product" (
    "id", "productId", "categoryId", "name", "nameAr", "short", "shortAr",
    "description", "descriptionAr", "features", "featuresAr", "price",
    "image", "type", "class", "sold", "popular", "likes"
) VALUES
${productInsertSQL()};

-- Foreign keys. ProductPrice (the trusted pricing registry) is linked to the
-- canonical catalog by the legacy numeric productId — one price row per product.

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

------ END: HOT PURSUIT RP - Phase 7 (Store catalog + Admin products) ------
`;
}

function main(): void {
  const validation = validateCatalog();
  if (!validation.ok) {
    console.error("[migration-generator] catalog validation FAILED — refusing to generate:");
    for (const e of validation.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const dir = resolve(here, "../prisma/migrations", MIGRATION_NAME);
  const file = resolve(dir, "migration.sql");
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, buildSQL(), "utf8");
  console.log(
    `[migration-generator] wrote ${MIGRATION_NAME}/migration.sql ` +
      `(${CATALOG_PRODUCTS.length} products, ${CATEGORIES.length} categories).`,
  );
}

main();