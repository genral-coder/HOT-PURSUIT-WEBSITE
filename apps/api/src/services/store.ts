import type { Permission, PagedAdminProducts, Product } from "@hotpursuit/types";
import type { Prisma } from "@prisma/client";
import { prisma } from "../database/client.js";
import { ApiError } from "../lib/errors.js";
import {
  STORE_ERROR_CODES,
  nextProductId,
  parseProductId,
  requireStoreManage,
  requireStoreView,
  serializeAdminProduct,
  serializePublicProduct,
  validateProductInput,
  type ProductRow,
  type ValidatedProductData,
} from "./storeLogic.js";

type ProductWithPrice = Prisma.ProductGetPayload<{ include: { priceReg: true } }>;

function toRow(row: ProductWithPrice): ProductRow {
  return row as unknown as ProductRow;
}

/* ───────────────────────────── Public (no auth) ───────────────────────────── */

export interface PublicProductQuery {
  category?: string;
  type?: string;
  class?: string;
  search?: string;
  popular?: boolean;
  sold?: boolean;
  sort?: "productId" | "name" | "createdAt";
  order?: "asc" | "desc";
}

/** GET /api/store/products — every available (non-archived) product, legacy shape. */
export async function listPublicProducts(query: PublicProductQuery = {}): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = { available: true };

  if (query.category) where.categoryId = query.category;
  if (query.type) where.type = query.type;
  if (query.class) where.class = query.class;
  if (query.popular !== undefined) where.popular = query.popular;
  if (query.sold !== undefined) where.sold = query.sold;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { short: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const orderClause: Prisma.ProductOrderByWithRelationInput =
    query.sort === "name"
      ? { name: query.order === "desc" ? "desc" : "asc" }
      : query.sort === "createdAt"
        ? { createdAt: query.order === "asc" ? "asc" : "desc" }
        : { productId: query.order === "desc" ? "desc" : "asc" };

  const rows = await prisma.product.findMany({
    where,
    orderBy: orderClause,
    include: { priceReg: true },
  });

  return rows.map((r) => serializePublicProduct(toRow(r)));
}

/** GET /api/store/products/:id — single product (archived products 404). */
export async function getPublicProduct(rawId: unknown): Promise<Product> {
  const productId = parseProductId(rawId);
  const row = await prisma.product.findFirst({
    where: { productId, available: true },
    include: { priceReg: true },
  });
  if (!row) {
    throw ApiError.notFound(STORE_ERROR_CODES.PRODUCT_NOT_FOUND, "Product not found.");
  }
  return serializePublicProduct(toRow(row));
}

/* ───────────────────────────── Admin (RBAC) ───────────────────────────── */

export interface AdminProductsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "archived" | "all";
  category?: string;
  sold?: boolean;
}

/** GET /api/admin/products — paginated admin rows (requires store.view). */
export async function listAdminProducts(
  actor: { permissions: Permission[] },
  query: AdminProductsQuery,
): Promise<PagedAdminProducts> {
  requireStoreView(actor);

  const where: Prisma.ProductWhereInput = {};
  if (query.search) {
    where.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
  }
  if (query.category) where.categoryId = query.category;
  if (query.sold !== undefined) where.sold = query.sold;
  if (query.status === "active") where.available = true;
  if (query.status === "archived") where.available = false;

  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { priceReg: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map((r) => serializeAdminProduct(toRow(r))),
    total,
    page: query.page,
    limit: query.limit,
  };
}

/** GET /api/admin/products/:id — single admin row (requires store.view). */
export async function getAdminProduct(
  actor: { permissions: Permission[] },
  rawId: unknown,
): Promise<PagedAdminProducts["products"][number]> {
  requireStoreView(actor);
  const productId = parseProductId(rawId);
  const row = await prisma.product.findUnique({
    where: { productId },
    include: { priceReg: true },
  });
  if (!row) {
    throw ApiError.notFound(STORE_ERROR_CODES.PRODUCT_NOT_FOUND, "Product not found.");
  }
  return serializeAdminProduct(toRow(row));
}

/** POST /api/admin/products — create a product + its price row (store.manage). */
export async function createProduct(
  actor: { permissions: Permission[] },
  input: unknown,
): Promise<PagedAdminProducts["products"][number]> {
  requireStoreManage(actor);
  const v = validateProductInput(input, { mode: "create" });

  const productId = nextProductId(
    await prisma.product.findMany({ select: { productId: true } }),
  );

  await prisma.$transaction(async (tx) => {
    await tx.product.create({
      data: {
        productId,
        categoryId: v.categoryId!,
        name: v.name!,
        nameAr: v.nameAr ?? null,
        short: v.short ?? null,
        shortAr: v.shortAr ?? null,
        description: v.description ?? null,
        descriptionAr: v.descriptionAr ?? null,
        features: v.features ?? [],
        featuresAr: v.featuresAr ?? [],
        price: v.price!,
        image: v.image ?? null,
        type: v.type ?? null,
        class: v.class ?? null,
        sold: v.sold ?? false,
        popular: v.popular ?? false,
        new: v.new ?? null,
        featured: v.featured ?? null,
        likes: v.likes ?? 0,
        available: v.available ?? true,
      },
    });
    await tx.productPrice.create({
      data: {
        productId,
        name: v.name!,
        nameAr: v.nameAr ?? null,
        image: v.image ?? null,
        amountCents: v.amountCents!,
        billing: v.billing!,
        available: !(v.sold ?? false) && (v.available ?? true),
      },
    });
  });

  const row = await prisma.product.findUniqueOrThrow({
    where: { productId },
    include: { priceReg: true },
  });
  return serializeAdminProduct(toRow(row));
}

/** PATCH /api/admin/products/:id — update product + derived price row. */
export async function updateProduct(
  actor: { permissions: Permission[] },
  rawId: unknown,
  input: unknown,
): Promise<PagedAdminProducts["products"][number]> {
  requireStoreManage(actor);
  const productId = parseProductId(rawId);
  const current = await prisma.product.findUnique({
    where: { productId },
    include: { priceReg: true },
  });
  if (!current) {
    throw ApiError.notFound(STORE_ERROR_CODES.PRODUCT_NOT_FOUND, "Product not found.");
  }

  const v = validateProductInput(input, { mode: "update" });

  const data: ValidatedProductData = {};
  if (v.categoryId !== undefined) data.categoryId = v.categoryId;
  if (v.name !== undefined) data.name = v.name;
  if (v.nameAr !== undefined) data.nameAr = v.nameAr;
  if (v.short !== undefined) data.short = v.short;
  if (v.shortAr !== undefined) data.shortAr = v.shortAr;
  if (v.description !== undefined) data.description = v.description;
  if (v.descriptionAr !== undefined) data.descriptionAr = v.descriptionAr;
  if (v.features !== undefined) data.features = v.features;
  if (v.featuresAr !== undefined) data.featuresAr = v.featuresAr;
  if (v.price !== undefined) data.price = v.price;
  if (v.image !== undefined) data.image = v.image;
  if (v.type !== undefined) data.type = v.type;
  if (v.class !== undefined) data.class = v.class;
  if (v.sold !== undefined) data.sold = v.sold;
  if (v.popular !== undefined) data.popular = v.popular;
  if (v.new !== undefined) data.new = v.new;
  if (v.featured !== undefined) data.featured = v.featured;
  if (v.likes !== undefined) data.likes = v.likes;
  if (v.available !== undefined) data.available = v.available;

  if (Object.keys(data).length === 0) {
    return serializeAdminProduct(toRow(current));
  }

  const finalSold = v.sold ?? current.sold;
  const finalAvailable = v.available ?? current.available;
  const priceAvailable = !finalSold && finalAvailable;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { productId },
      data: data as Prisma.ProductUpdateInput,
    });
    await tx.productPrice.upsert({
      where: { productId },
      update: {
        name: v.name ?? current.name,
        nameAr: v.nameAr !== undefined ? v.nameAr : current.nameAr,
        image: v.image !== undefined ? v.image : current.image,
        amountCents: v.amountCents ?? current.priceReg?.amountCents ?? 0,
        billing: v.billing ?? current.priceReg?.billing ?? "MONTHLY",
        available: priceAvailable,
      },
      create: {
        productId,
        name: v.name ?? current.name,
        nameAr: v.nameAr !== undefined ? v.nameAr : current.nameAr,
        image: v.image !== undefined ? v.image : current.image,
        amountCents: v.amountCents ?? current.priceReg?.amountCents ?? 0,
        billing: v.billing ?? current.priceReg?.billing ?? "MONTHLY",
        available: priceAvailable,
      },
    });
  });

  const row = await prisma.product.findUniqueOrThrow({
    where: { productId },
    include: { priceReg: true },
  });
  return serializeAdminProduct(toRow(row));
}

/**
 * DELETE /api/admin/products/:id — archive (soft delete, never a hard delete).
 * Arches `available`, which simultaneously hides the product from the store
 * and marks its price row unavailable so it can never be ordered again.
 * Restore is a PATCH with available:true.
 */
export async function setProductArchive(
  actor: { permissions: Permission[] },
  rawId: unknown,
  archive: boolean,
): Promise<{ productId: number; available: boolean }> {
  requireStoreManage(actor);
  const productId = parseProductId(rawId);
  const current = await prisma.product.findUnique({
    where: { productId },
    include: { priceReg: true },
  });
  if (!current) {
    throw ApiError.notFound(STORE_ERROR_CODES.PRODUCT_NOT_FOUND, "Product not found.");
  }

  const priceAvailable = !current.sold && archive;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { productId },
      data: { available: archive },
    });
    if (current.priceReg) {
      await tx.productPrice.update({
        where: { productId },
        data: { available: priceAvailable },
      });
    }
  });

  return { productId, available: archive };
}