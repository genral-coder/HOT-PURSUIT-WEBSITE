import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { isDatabaseConnected } from "../database/client.js";

export const healthRouter = Router();

/**
 * GET /api/health
 * Reports API + optional database connectivity. Never exposes connection
 * strings or other sensitive DB details — just a safe boolean.
 */
healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const db = await isDatabaseConnected();
    res.status(db ? 200 : 503).json({
      status: db ? "ok" : "degraded",
      service: "hot-pursuit-api",
      api: "healthy",
      database: db ? "connected" : "unavailable",
      time: new Date().toISOString(),
    });
  }),
);
