# HOT PURSUIT RP — Platform monorepo

Production rewrite of the HOT PURSUIT RP FiveM community website.
Migrates the legacy vanilla-JS site into a typed, full-stack monorepo while
preserving branding, EN/AR + RTL support, and 100% of store data.

## Stack

- `apps/web` — React 18 + TypeScript + Vite + Tailwind (dark-cinematic HOT PURSUIT theme)
- `apps/api` — Node.js + Express + TypeScript (REST)
  - PostgreSQL via [Prisma](https://prisma.io) + server-side sessions
    (`express-session` + `connect-pg-simple`)
  - Discord OAuth2 (server-side, HTTP-only cookie sessions)
  - Role/permission authorization (OWNER, ADMIN, MODERATOR, CONTENT_MANAGER)
- `packages/types` — shared domain types (auth/user/permission models)
- `packages/config` — design tokens + i18n dictionary (EN/AR)
- `packages/shared` — framework-agnostic utilities
- Future: full Admin Panel, payments, FiveM integration

## Getting started

Node.js 20+ and PostgreSQL are required.

### 1. Install

```bash
npm install        # from the repo root (installs all workspaces)
```

### 2. Environment

Copy `.env.example` to `.env` and fill real values. **Never commit the real
`.env`.** Server-side secrets (`DATABASE_URL`, `DISCORD_CLIENT_SECRET`,
`SESSION_SECRET`, `OWNER_DISCORD_IDS`) must never appear in the frontend or in
Vite env vars.

### 3. Database (PostgreSQL)

Start a local PostgreSQL instance, then:

```bash
# from the repo root — DATABASE_URL is read from your root .env
npm run db:generate --workspace @hotpursuit/api   # generate Prisma client
npm run db:migrate --workspace @hotpursuit/api    # apply + create migrations
npm run db:seed    --workspace @hotpursuit/api    # seed roles & permissions
```

Or apply migrations without source changes in production:
`npm run db:deploy --workspace @hotpursuit/api`.

### 4. Run

```bash
npm run dev --workspace @hotpursuit/api   # API (http://localhost:4000)
npm run dev:web                           # web (http://localhost:5173)
```

### 5. Discord OAuth

1. Create an application at <https://discord.com/developers/applications>.
2. Add a redirect: `http://localhost:4000/api/auth/discord/callback`.
3. Fill `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
   `DISCORD_REDIRECT_URI`, `SESSION_SECRET` in `.env`.
4. Optional: add your Discord user id list to `OWNER_DISCORD_IDS` to grant the
   Owner role (server-side).

### 6. Tests

```bash
npm test --workspace @hotpursuit/api      # RBAC + error/validation unit tests
npm run typecheck                         # typecheck every workspace
npm run build                             # production build (web + api)
```

## Security model

- Discord OAuth runs entirely **server-side**; the client secret never reaches
  the browser. Sessions use **HTTP-only cookies** (`HttpOnly`, `Secure`,
  `SameSite`) and store only a user id.
- The backend never trusts `role`, `permissions`, `discordId` or `userId` from
  the client — identity comes from the session, authorization is recomputed per
  request.
- Owner status comes only from `OWNER_DISCORD_IDS` (server env) or database
  roles — a user can never grant themselves Owner.
- CORS allows only the configured `CLIENT_ORIGIN` (plus localhost in dev) with
  `credentials`; authenticated requests never use `Access-Control-Allow-Origin: *`.
- Errors are sanitized: no stack traces, DB errors, or Discord secrets are ever
  returned to clients.
- The API boots even if PostgreSQL is unavailable; `/api/health` reports
  `database: "unavailable"` and unauth/session routes fail gracefully.

## No-fake-data policy

- The API never fakes Discord users, sessions, database connections, payments
  or FiveM data.
- The Store product catalog (39 products/34 images) remains **static** on the
  frontend (`apps/web/src/data`). Authenticated favorites are stored in
  PostgreSQL keyed by product id; the `Product` table + catalog sync is a
  future Store phase (avoids duplicating the static catalog).

## Design notes

- Do **not** ship fake production data. Empty links render as “coming soon”.
- Admin authorization is **server-side only**; never trust client-side roles.
- Rules are intentionally **not** in the main navigation.
- RTL/Arabic use logical properties so layout stays correct in both languages.

## Data migration

39 products and 34 images were migrated verbatim from the legacy
`products.json` / `images/` into `apps/web/src/data` and `apps/web/public`.
