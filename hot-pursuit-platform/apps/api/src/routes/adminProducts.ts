import { Router } from "express";
import type { AuthPrincipal } from "../middleware/auth.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../lib/errors.js";
import { recordAudit } from "../services/audit.js";
import {
  createProduct,
  getAdminProduct,
  listAdminProducts,
  setProductArchive,
  updateProduct,
} from "../services/store.js";

/**
 * Admin product management (real CRUD against the canonical Product catalog).
 *
 * Every route requires auth; granular permissions:
 *   GET      /api/admin/products        store.view
 *   GET      /api/admin/products/:id    store.view
 *   POST     /api/admin/products        store.manage
 *   PATCH    /api/admin/products/:id    store.manage
 *   DELETE   /api/admin/products/:id    store.manage   (archive — soft delete)
 *
 * All create/update/archive actions are audit-logged (PRODUCT_*).
 */
export const adminProductsRouter = Router();

adminProductsRouter.use(requireAuth);

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * GET /api/admin/products?search=&status=&category=&sold=&page=&limit=
 */
adminProductsRouter.get(
  "/",
  requirePermission("store.view"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const page = Math.max(1, positiveInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, positiveInt(req.query.limit, 20)));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status =
      req.query.status === "active" || req.query.status === "archived"
        ? req.query.status
        : "all";
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const sold =
      req.query.sold === "true" || req.query.sold === "false"
        ? req.query.sold === "true"
        : undefined;

    const result = await listAdminProducts(principal.access, {
      page,
      limit,
      search,
      status,
      category,
      sold,
    });
    res.json(result);
  }),
);

/**
 * GET /api/admin/products/:id — full admin row incl. pricing.
 */
adminProductsRouter.get(
  "/:id",
  requirePermission("store.view"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const row = await getAdminProduct(principal.access, req.params.id);
    res.json({ product: row });
  }),
);

/**
 * POST /api/admin/products — create a product + its trusted price row.
 * The legacy numeric id is assigned server-side (max + 1), never by the client.
 */
adminProductsRouter.post(
  "/",
  requirePermission("store.manage"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const product = await createProduct(principal.access, req.body);

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "PRODUCT_CREATED",
      targetResource: String(product.id),
      metadata: { name: product.name },
    });

    res.status(201).json({ product });
  }),
);

/**
 * PATCH /api/admin/products/:id — update fields + derived price row.
 */
adminProductsRouter.patch(
  "/:id",
  requirePermission("store.manage"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const product = await updateProduct(principal.access, req.params.id, req.body);

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "PRODUCT_UPDATED",
      targetResource: String(product.id),
      metadata: { name: product.name },
    });

    res.json({ product });
  }),
);

/**
 * DELETE /api/admin/products/:id — archive (soft delete only). The product is
 * hidden from the store and its price row marked unavailable so it can never
 * be ordered again. Restore via PATCH available:true.
 */
adminProductsRouter.delete(
  "/:id",
  requirePermission("store.manage"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const result = await setProductArchive(principal.access, req.params.id, false);

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "PRODUCT_ARCHIVED",
      targetResource: String(result.productId),
      metadata: { available: false },
    });

    res.json({ ok: true, ...result });
  }),
);