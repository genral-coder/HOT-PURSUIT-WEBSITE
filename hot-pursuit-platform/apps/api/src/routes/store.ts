import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { getPublicProduct, listPublicProducts } from "../services/store.js";
import { CATEGORY_IDS } from "../services/storeLogic.js";

/**
 * Public Store catalog API.
 *
 * GET /api/store/products          → list (id, category, name, ... filters)
 * GET /api/store/products/:id      → single product (archived → 404)
 *
 * No authentication, no admin fields. The response is the EXACT legacy
 * `Product` shape the frontend already renders — the Store keeps its UX while
 * the database becomes the single source of truth.
 */
export const storeRouter = Router();

storeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, type, class: klass, search, sort, order } = req.query;

    const products = await listPublicProducts({
      category:
        typeof category === "string" && (CATEGORY_IDS as string[]).includes(category)
          ? category
          : undefined,
      type: typeof type === "string" && type.trim() ? type.trim() : undefined,
      class: typeof klass === "string" && klass.trim() ? klass.trim() : undefined,
      search: typeof search === "string" && search.trim() ? search.trim() : undefined,
      sort: sort === "name" || sort === "createdAt" ? sort : undefined,
      order: order === "asc" || order === "desc" ? order : undefined,
    });

    res.json({ products, total: products.length });
  }),
);

storeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await getPublicProduct(req.params.id);
    res.json({ product });
  }),
);