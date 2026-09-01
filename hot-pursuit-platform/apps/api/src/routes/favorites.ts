import { Router } from "express";
import { prisma } from "../database/client.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { productId } from "../lib/validate.js";
import { requireAuth, type AuthPrincipal } from "../middleware/auth.js";

export const favoritesRouter = Router();

// All favorite endpoints require an authenticated user.
favoritesRouter.use(requireAuth);

/**
 * GET /api/store/favorites
 * Returns the authenticated user's favorite product ids. The ids map to the
 * static frontend catalog (the catalog is not in the DB this phase).
 */
favoritesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const rows = await prisma.favorite.findMany({
      where: { userId: principal.userId },
      select: { productId: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ ids: rows.map((r) => r.productId) });
  }),
);

/**
 * POST /api/store/favorites/:productId
 * Adds a favorite. Validates the product id is a positive integer. Duplicate
 * favorites are ignored (upsert behaviour).
 */
favoritesRouter.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const id = productId(req.params.productId);

    await prisma.favorite.upsert({
      where: { userId_productId: { userId: principal.userId, productId: id } },
      update: {},
      create: { userId: principal.userId, productId: id },
    });

    res.status(201).json({ ok: true, productId: id });
  }),
);

/**
 * DELETE /api/store/favorites/:productId
 * Removes a favorite. Missing favorites are treated as success (idempotent).
 */
favoritesRouter.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const id = productId(req.params.productId);

    await prisma.favorite.deleteMany({
      where: { userId: principal.userId, productId: id },
    });

    res.json({ ok: true, productId: id });
  }),
);
