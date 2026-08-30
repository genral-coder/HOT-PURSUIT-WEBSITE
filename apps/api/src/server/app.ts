import express, { type Express } from "express";
import cors from "cors";
import { env, isProd } from "../config/env.js";

/**
 * Builds the Express application. Only the health route is wired for now.
 * Discord OAuth, PostgreSQL, admin/orders/auth modules are added in later
 * phases. No fake or hard-coded production data lives here.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: isProd ? env.clientOrigin : true,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "hot-pursuit-api",
      time: new Date().toISOString(),
    });
  });

  // Placeholder-aware 404 for unknown API routes.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  return app;
}
