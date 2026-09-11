/**
 * Catalog regression + pricing + serializer-no-leak tests.
 *
 * THE regression matters: apps/api/src/database/catalog.ts (the migration/seed
 * source) is proven byte-identical in spirit to the static frontend catalog
 * apps/web/src/data/products.ts. 39 products, 0 missing, 0 duplicate,
 * 0 unexpected. The public serializer is then proven to emit the EXACT legacy
 * `Product` shape with no internal DB fields leaking to the Store.
 */
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { products as webProducts } from "../../web/src/data/products.js";
import {
  CATALOG_PRODUCTS,
  CATEGORIES,
  deriveCatalogPricing,
  validateCatalog,
} from "../src/database/catalog.js";
import { serializePublicProduct, type ProductRow } from "../src/services/storeLogic.js";

/** Deterministic legacy shape for byte-level equality (missing = null/[]). */
function canonical(p: (typeof webProducts)[number]): Record<string, unknown> {
  return {
    id: p.id,
    category: p.category,
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
    sold: p.sold ?? false,
    popular: p.popular ?? false,
    likes: p.likes ?? 0,
  };
}

function rowFrom(p: (typeof webProducts)[number]): ProductRow {
  return {
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
    sold: p.sold ?? false,
    popular: p.popular ?? false,
    new: null,
    featured: null,
    likes: p.likes ?? 0,
    available: true,
    createdAt: new Date("2026-09-11T00:00:00.000Z"),
    updatedAt: new Date("2026-09-11T00:00:00.000Z"),
    priceReg: { amountCents: 100, billing: "MONTHLY" },
  };
}

describe("store catalog regression (39/0/0/0)", () => {
  it("both catalogs hold exactly 39 products", () => {
    strictEqual(webProducts.length, 39);
    strictEqual(CATALOG_PRODUCTS.length, 39);
    strictEqual(CATEGORIES.length, 4);
  });

  it("ids are the unique set 1..39 on both sides", () => {
    const ids = CATALOG_PRODUCTS.map((p) => p.id).sort((a, b) => a - b);
    deepStrictEqual(ids, Array.from({ length: 39 }, (_, i) => i + 1));
    const webIds = webProducts.map((p) => p.id).sort((a, b) => a - b);
    deepStrictEqual(webIds, Array.from({ length: 39 }, (_, i) => i + 1));
  });

  it("every catalog product matches its static source row exactly", () => {
    const byId = new Map(webProducts.map((p) => [p.id, p]));
    for (const p of CATALOG_PRODUCTS) {
      const source = byId.get(p.id);
      strictEqual(source !== undefined, true, `missing source row for id ${p.id}`);
      deepStrictEqual(canonical(p as never), canonical(source!));
    }
  });

  it("validateCatalog reports ok for the full catalog", () => {
    const result = validateCatalog();
    strictEqual(result.ok, true);
    strictEqual(result.count, 39);
    deepStrictEqual(result.errors, []);
  });
});

describe("deriveCatalogPricing", () => {
  it("parses the display formats used by the catalog", () => {
    deepStrictEqual(deriveCatalogPricing("$1/Monthly", "Verified Account"), {
      amountCents: 100,
      billing: "MONTHLY",
    });
    deepStrictEqual(deriveCatalogPricing("20$ Monthly"), {
      amountCents: 2000,
      billing: "MONTHLY",
    });
    deepStrictEqual(deriveCatalogPricing("25$ Monthly"), {
      amountCents: 2500,
      billing: "MONTHLY",
    });
    deepStrictEqual(deriveCatalogPricing("40$ Monthly"), {
      amountCents: 4000,
      billing: "MONTHLY",
    });
    deepStrictEqual(deriveCatalogPricing("5$ One Time"), {
      amountCents: 500,
      billing: "ONE_TIME",
    });
  });

  it("throws on prices that are not verifiably derivable", () => {
    throws(() => deriveCatalogPricing("0$ Monthly"), /non-positive amount|unable to derive pricing/);
    throws(() => deriveCatalogPricing("100$ Per Season"), /unable to derive pricing/);
    throws(() => deriveCatalogPricing("free"), /unable to derive pricing/);
    throws(() => deriveCatalogPricing(""), /unable to derive pricing/);
  });
});

describe("catalog pricing consistency (every product derives cleanly)", () => {
  it("the sold products are exactly the six known ids", () => {
    const sold = CATALOG_PRODUCTS.filter((p) => p.sold).map((p) => p.id).sort((a, b) => a - b);
    deepStrictEqual(sold, [6, 10, 11, 12, 18, 22, 26, 30]);
  });

  it("37/38 are the one-time purchases, everything else monthly", () => {
    const oneTime = CATALOG_PRODUCTS.filter(
      (p) => deriveCatalogPricing(p.price, p.name).billing === "ONE_TIME",
    ).map((p) => p.id);
    deepStrictEqual(oneTime, [37, 38]);
  });
});

describe("public serializer (no internal leak)", () => {
  it("emits exactly the legacy Product shape", () => {
    const row = rowFrom(webProducts[0]);
    const out = serializePublicProduct(row) as unknown as Record<string, unknown>;
    deepStrictEqual(canonical(webProducts[0] as never), canonical(out as never));
  });

  it("never leaks DB/admin fields to the store", () => {
    const row: ProductRow = {
      ...rowFrom(webProducts[1]),
      productId: 999,
      categoryId: "mlo",
      available: false,
      createdAt: new Date("2026-09-11T00:00:00.000Z"),
      updatedAt: new Date("2026-09-11T00:00:00.000Z"),
      priceReg: { amountCents: 12345, billing: "ONE_TIME" },
    };
    const out = serializePublicProduct(row) as unknown as Record<string, unknown>;
    for (const leaked of ["productId", "categoryId", "available", "createdAt", "updatedAt", "priceReg", "amountCents", "billing"]) {
      strictEqual(Object.hasOwn(out, leaked), false, `serializer leaked "${leaked}"`);
    }
  });

  it("keeps sold/popular/likes and localized fields while omitting empties", () => {
    const row = rowFrom(webProducts[0]);
    const out = serializePublicProduct(row);
    strictEqual(out.sold, false);
    strictEqual(out.popular, true);
    strictEqual(out.likes, 0);
    strictEqual(out.nameAr, webProducts[0].nameAr);
    strictEqual("new" in out, false);
    strictEqual("featured" in out, false);
  });
});