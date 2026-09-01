import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { env } from "../config/env.js";
import { authRouter } from "../routes/auth.js";
import { favoritesRouter } from "../routes/favorites.js";
import { healthRouter } from "../routes/health.js";
import { adminsRouter } from "../routes/admins.js";
import { errorHandler } from "../lib/errors.js";

/**
 * Builds the Express application.
 *
 * Phase 3 wires the secure foundation: PostgreSQL-backed sessions, Discord
 * OAuth, role/permission authorization and authenticated store favorites.
 * The existing /api/health route is preserved (and now reports DB state).
 *
 * No fake Discord users, sessions or database connections are created — every
 * external integration is real and fails gracefully when not configured.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  // CORS: allow only the configured frontend origin with credentials. Never
  // `*` for authenticated requests. In development the origin can be reflected
  // for the known local frontend while still requiring credentials.
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser clients (curl, tests) and the known origin.
        if (!origin || origin === env.clientOrigin) return cb(null, true);
        if (!env.isProd && origin.startsWith("http://localhost:")) {
          return cb(null, true);
        }
        cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  app.use(express.json());

  // Server-side sessions backed by PostgreSQL (connect-pg-simple). Only a
  // user id is stored; identity, roles and permissions are always resolved
  // server-side per request.
  if (env.sessionSecret) {
    const PgStore = connectPgSimple(session);
    const store = new PgStore({
      conString: env.databaseUrl,
      tableName: "session",
      // Fail gracefully if the DB is down: session creation errors are caught
      // by express-session so the API doesn't crash.
      createTableIfMissing: true,
    });

    app.use(
      session({
        store,
        name: "hp_session",
        secret: env.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: env.sessionSecure,
          sameSite: env.sessionSameSite,
          maxAge: env.sessionMaxAgeMs,
          ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
        },
      }),
    );
  } else {
    // No session secret configured: auth is disabled but the API still boots.
    app.use((req, _res, next) => {
      req.session = undefined as never;
      next();
    });
  }

  // Routes
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  // Store favorites require auth (self-originated, not a spoof-able path).
  app.use("/api/store/favorites", favoritesRouter);

  // Admin management + summary. Every route enforces its own permission.
  app.use("/api/admins", adminsRouter);

  // Placeholder-aware 404 for unknown API routes.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  // Central error handler (safe responses, no leaked internals).
  app.use(errorHandler);

  return app;
}
