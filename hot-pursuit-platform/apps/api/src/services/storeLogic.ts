import type {
  AdminProductRow,
  Billing,
  BusinessTypeId,
  Product,
  ProductCategoryId,
  UpdateProductInput,
  VehicleClassId,
  Permission,
} from "@hotpursuit/types";
import { ApiError } from "../lib/errors.js";

/**
 * Pure Store-domain logic (no DB access). Unit-testable without a database:
 *   - create/patch input validation (server-enforced, never trusts the client)
 *   - legacy-shape public serializers (the public API returns the EXACT legacy
 *     `Product` shape — no pricing/amounts/timestamps ever leak to the Store)
 *   - admin serializers (AdminProductRow)
 *   - granular authz guards (store.view / store.manage)
 *   - legacy numeric id allocation (max + 1, never client-supplied)
 */

/** Stable, client-safe error codes for the store domain. */
export const STORE_ERROR_CODES = {
  INVALID_CATEGORY: "INVALID_CATEGORY",
  INVALID_PRICE: "INVALID_PRICE",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_BILLING: "INVALID_BILLING",
  INVALID_IMAGE: "INVALID_IMAGE",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_ID_CONFLICT: "PRODUCT_ID_CONFLICT",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
} as const;

/** Max value for amountCents (1 million USD-equivalent). */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

export const CATEGORY_IDS: ProductCategoryId[] = ["vehicles", "mlo", "vip", "bundles"];
export const BUSINESS_TYPE_IDS: BusinessTypeId[] = [
  "restaurant",
  "mechanic",
  "dealership",
  "nightclub",
  "cafe",
  "hotel",
];
export const VEHICLE_CLASS_IDS: VehicleClassId[] = ["S", "S+", "S++", "X"];
export const BILLINGS: Billing[] = ["MONTHLY", "ONE_TIME"];

/* ───────────────────────────── helpers ───────────────────────────── */

function bool(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    throw ApiError.badRequest("invalid_input", `${name} must be a boolean.`);
  }
  return value;
}

function invalid(name: string): never {
  throw ApiError.badRequest("invalid_input", `Invalid ${name}.`);
}

/** Optional text: undefined = absent, null or "" = clear, string = set. */
function maybeText(
  value: unknown,
  name: string,
  max: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") invalid(name);
  const t = value.trim();
  if (t.length === 0) return null;
  if (t.length > max) {
    throw ApiError.badRequest(
      "invalid_input",
      `${name} must be at most ${max} characters.`,
    );
  }
  return t;
}

/** Optional string array: undefined = absent, null = clear, array = set. */
function maybeStrings(
  value: unknown,
  name: string,
  maxItems: number,
  maxLen: number,
): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) invalid(name);
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") invalid(name);
    const t = v.trim();
    if (t.length === 0) continue;
    if (t.length > maxLen || out.length >= maxItems) {
      throw ApiError.badRequest(
        "invalid_input",
        `${name} must contain at most ${maxItems} items of at most ${maxLen} characters.`,
      );
    }
    out.push(t);
  }
  return out;
}

/** Asset path reference: relative "images/…" paths only, never URLs/absolute. */
function imagePath(value: string): string {
  const v = value.trim();
  if (!v || v.length > 500 || /(:\/\/|^[\\/]|\.\.|\\+)/.test(v)) {
    throw ApiError.badRequest(
      STORE_ERROR_CODES.INVALID_IMAGE,
      "Image must be a relative asset path (e.g. images/products/…).",
    );
  }
  return v;
}

/* ───────────────────────────── validation ───────────────────────────── */

/** Normalized product fields. undefined = not provided, null = explicitly clear. */
export interface ValidatedProductData {
  categoryId?: ProductCategoryId;
  name?: string;
  nameAr?: string | null;
  short?: string | null;
  shortAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  features?: string[];
  featuresAr?: string[];
  price?: string;
  image?: string | null;
  type?: string | null;
  class?: string | null;
  sold?: boolean;
  popular?: boolean;
  new?: boolean | null;
  featured?: boolean | null;
  likes?: number;
  available?: boolean;
  amountCents?: number;
  billing?: Billing;
}

function categoryOf(value: unknown): ProductCategoryId {
  if (typeof value !== "string" || !CATEGORY_IDS.includes(value as ProductCategoryId)) {
    throw ApiError.badRequest(
      STORE_ERROR_CODES.INVALID_CATEGORY,
      `Category must be one of: ${CATEGORY_IDS.join(", ")}.`,
    );
  }
  return value as ProductCategoryId;
}

function amountOf(value: unknown, name = "amountCents"): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > MAX_AMOUNT_CENTS) {
    throw ApiError.badRequest(
      STORE_ERROR_CODES.INVALID_AMOUNT,
      `${name} must be a positive integer below ${MAX_AMOUNT_CENTS}.`,
    );
  }
  return n;
}

function billingOf(value: unknown): Billing {
  if (typeof value !== "string" || !BILLINGS.includes(value as Billing)) {
    throw ApiError.badRequest(
      STORE_ERROR_CODES.INVALID_BILLING,
      `billing must be one of: ${BILLINGS.join(", ")}.`,
    );
  }
  return value as Billing;
}

/**
 * Validate untrusted admin input (create or update). In create mode the core
 * fields (category, name, price, amountCents, billing) are required; in update
 * mode every field is optional. Returns the normalized, server-safe data.
 */
export function validateProductInput(
  input: unknown,
  opts: { mode: "create" | "update" },
): ValidatedProductData {
  const body = (input ?? {}) as Record<string, unknown>;
  const out: ValidatedProductData = {};

  const rawCategory = body.category;
  if (rawCategory !== undefined) out.categoryId = categoryOf(rawCategory);

  const rawName = body.name;
  if (rawName !== undefined) {
    if (typeof rawName !== "string" || rawName.trim().length === 0) {
      throw ApiError.badRequest("invalid_input", "name is required.");
    }
    const name = rawName.trim();
    if (name.length > 80) {
      throw ApiError.badRequest("invalid_input", "name must be at most 80 characters.");
    }
    out.name = name;
  }

  const nameAr = maybeText(body.nameAr, "nameAr", 120);
  if (nameAr !== undefined) out.nameAr = nameAr;

  const short = maybeText(body.short, "short", 160);
  if (short !== undefined) out.short = short;

  const shortAr = maybeText(body.shortAr, "shortAr", 160);
  if (shortAr !== undefined) out.shortAr = shortAr;

  const description = maybeText(body.description, "description", 2000);
  if (description !== undefined) out.description = description;

  const descriptionAr = maybeText(body.descriptionAr, "descriptionAr", 2000);
  if (descriptionAr !== undefined) out.descriptionAr = descriptionAr;

  const features = maybeStrings(body.features, "features", 20, 200);
  if (features !== undefined) out.features = features === null ? [] : features;

  const featuresAr = maybeStrings(body.featuresAr, "featuresAr", 20, 200);
  if (featuresAr !== undefined) out.featuresAr = featuresAr === null ? [] : featuresAr;

  const rawPrice = body.price;
  if (rawPrice !== undefined) {
    const price = maybeText(rawPrice, "price", 50);
    if (price === undefined || price === null) {
      throw ApiError.badRequest(STORE_ERROR_CODES.INVALID_PRICE, "price is required.");
    }
    out.price = price;
  }

  const rawImage = body.image;
  if (rawImage !== undefined) {
    if (rawImage === null || rawImage === "") {
      out.image = null;
    } else {
      if (typeof rawImage !== "string") invalid("image");
      out.image = imagePath(rawImage);
    }
  }

  const rawType = body.type;
  if (rawType !== undefined) {
    if (rawType === null || rawType === "") {
      out.type = null;
    } else {
      if (typeof rawType !== "string" || !BUSINESS_TYPE_IDS.includes(rawType as BusinessTypeId)) {
        invalid("type");
      }
      out.type = rawType;
    }
  }

  const rawClass = body.class;
  if (rawClass !== undefined) {
    if (rawClass === null || rawClass === "") {
      out.class = null;
    } else {
      if (typeof rawClass !== "string" || !VEHICLE_CLASS_IDS.includes(rawClass as VehicleClassId)) {
        invalid("class");
      }
      out.class = rawClass;
    }
  }

  if (body.sold !== undefined) out.sold = bool(body.sold, "sold");
  if (body.popular !== undefined) out.popular = bool(body.popular, "popular");
  if (body.new !== undefined) out.new = body.new === null ? null : bool(body.new, "new");
  if (body.featured !== undefined)
    out.featured = body.featured === null ? null : bool(body.featured, "featured");

  if (body.likes !== undefined) {
    const n = typeof body.likes === "number" ? body.likes : Number(body.likes);
    if (!Number.isInteger(n) || n < 0) {
      throw ApiError.badRequest("invalid_input", "likes must be a non-negative integer.");
    }
    out.likes = n;
  }

  if (body.available !== undefined) out.available = bool(body.available, "available");

  if (body.amountCents !== undefined) out.amountCents = amountOf(body.amountCents);
  if (body.billing !== undefined) out.billing = billingOf(body.billing);

  if (opts.mode === "create") {
    if (out.categoryId === undefined) {
      throw ApiError.badRequest(STORE_ERROR_CODES.INVALID_CATEGORY, "category is required.");
    }
    if (out.name === undefined) {
      throw ApiError.badRequest("invalid_input", "name is required.");
    }
    if (out.price === undefined) {
      throw ApiError.badRequest(STORE_ERROR_CODES.INVALID_PRICE, "price is required.");
    }
    if (out.amountCents === undefined) {
      throw ApiError.badRequest(
        STORE_ERROR_CODES.INVALID_AMOUNT,
        "amountCents is required.",
      );
    }
    if (out.billing === undefined) {
      throw ApiError.badRequest(STORE_ERROR_CODES.INVALID_BILLING, "billing is required.");
    }
  }

  // Category-scoped fields: `type` only on mlo, `class` only on vehicles.
  if (out.categoryId !== undefined && out.categoryId !== "mlo") out.type = null;
  if (out.categoryId !== undefined && out.categoryId !== "vehicles") out.class = null;

  return out;
}

/* ───────────────────────────── serializers ───────────────────────────── */

/**
 * A DB product row (Product + its optional ProductPrice registry row) in a
 * structural shape — no DB imports needed for pure tests.
 */
export interface ProductRow {
  productId: number;
  categoryId: string;
  name: string;
  nameAr: string | null;
  short: string | null;
  shortAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  features: string[];
  featuresAr: string[];
  price: string;
  image: string | null;
  type: string | null;
  class: string | null;
  sold: boolean;
  popular: boolean;
  new: boolean | null;
  featured: boolean | null;
  likes: number | null;
  available: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  priceReg: {
    amountCents: number;
    billing: Billing;
  } | null;
}

/**
 * Public (Store-facing) serializer: returns the EXACT legacy `Product` shape.
 * No internal fields (productId of the row apart from the legacy `id`,
 * categoryId, available, priceReg, amounts, timestamps) ever leak out.
 */
export function serializePublicProduct(row: ProductRow): Product {
  const out: Product = {
    id: row.productId,
    category: row.categoryId as ProductCategoryId,
    name: row.name,
    price: row.price,
  };
  if (row.nameAr) out.nameAr = row.nameAr;
  if (row.short) out.short = row.short;
  if (row.shortAr) out.shortAr = row.shortAr;
  if (row.description) out.description = row.description;
  if (row.descriptionAr) out.descriptionAr = row.descriptionAr;
  if (row.features?.length) out.features = row.features;
  if (row.featuresAr?.length) out.featuresAr = row.featuresAr;
  if (row.image) out.image = row.image;
  if (row.type) out.type = row.type as BusinessTypeId;
  if (row.class) out.class = row.class as VehicleClassId;
  out.sold = row.sold;
  out.popular = row.popular;
  if (row.new) out.new = row.new;
  if (row.featured) out.featured = row.featured;
  out.likes = row.likes ?? 0;
  return out;
}

/** Admin serializer: the public shape plus the management-only fields. */
export function serializeAdminProduct(row: ProductRow): AdminProductRow {
  return {
    ...serializePublicProduct(row),
    available: row.available,
    amountCents: row.priceReg?.amountCents ?? 0,
    billing: row.priceReg?.billing ?? "MONTHLY",
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/* ───────────────────────────── authz ───────────────────────────── */

/** Assert the actor holds store.view (pure, unit-testable). */
export function requireStoreView(actor: { permissions: Permission[] }): void {
  if (!actor.permissions.includes("store.view")) {
    throw ApiError.forbidden("forbidden", "You do not have permission.");
  }
}

/** Assert the actor holds store.manage (pure, unit-testable). */
export function requireStoreManage(actor: { permissions: Permission[] }): void {
  if (!actor.permissions.includes("store.manage")) {
    throw ApiError.forbidden("forbidden", "You do not have permission.");
  }
}

/* ───────────────────────────── id allocation ───────────────────────────── */

/**
 * Allocate the next legacy numeric product id server-side (max + 1). The
 * client can never pick an id — the server derives it from existing rows.
 */
export function nextProductId(existing: Array<{ productId: number }>): number {
  const ids = existing.map((p) => p.productId);
  const next = (ids.length ? Math.max(...ids) : 0) + 1;
  if (ids.includes(next)) {
    throw ApiError.conflict(
      STORE_ERROR_CODES.PRODUCT_ID_CONFLICT,
      `Product id ${next} is already taken.`,
    );
  }
  return next;
}

/** Resolve a raw product id from URL/body defensively. */
export function parseProductId(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw ApiError.badRequest("invalid_product_id", "Invalid product id.");
  }
  return n;
}

/** Assert a product id exists (404 otherwise). */
export function isLegacyProduct<T extends { productId: number }>(
  row: T | null,
): row is T {
  if (!row) {
    throw ApiError.notFound(STORE_ERROR_CODES.PRODUCT_NOT_FOUND, "Product not found.");
  }
  return true;
}

/** Type guard for update patches (only typed fields are ever written). */
export function toUpdateInput(body: Record<string, unknown>): UpdateProductInput {
  return body as UpdateProductInput;
}