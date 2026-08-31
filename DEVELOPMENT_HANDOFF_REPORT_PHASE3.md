# DEVELOPMENT HANDOFF REPORT — HOT PURSUIT RP Platform — PHASE 3

**Phase:** Discord OAuth + PostgreSQL + Secure User Foundation + Admin Authorization
**Date:** 2026-08-31
**Monorepo root:** `hot-pursuit-platform/` (separate git repo, branch `master`)
**Base commits:** `02f38e3`, `15e6447` (Store verification/refinement — complete)

> **Honesty note:** No live PostgreSQL or real Discord Developer credentials were
> available in this environment. Accordingly, database-heavy and OAuth callback behaviour
> are marked **BLOCKED** (requires a live DB / real credentials) rather than faked or
> assumed. Everything that can run without them (TypeScript, builds, unit tests, API boot,
> graceful DB-degradation, `/api/health`, unauth rejection) is **VERIFIED** below.

---

## 0. STATUS SUMMARY

| Status | Value |
|---|---|
| **AUTH STATUS** | **PARTIAL** — OAuth flow fully implemented server-side; marked **BLOCKED** for live end-to-end until Discord credentials are provided |
| **DATABASE STATUS** | **PARTIAL** — full Prisma schema + migrations + seed written & validated against Prisma's expected SQL; applying them **BLOCKED** (no local PostgreSQL) |
| **ADMIN AUTHORIZATION STATUS** | **IMPLEMENTED** — RBAC roles/permissions, server-side `requireRole`/`requirePermission`, Owner bridge, unit-tested (14/14) |
| **SECURITY STATUS** | **IMPLEMENTED** — HTTP-only cookies, server-side OAuth, CORS origin allow-list, sanitized errors, server-side-only identity |
| **STORE REGRESSION STATUS** | **IMPLEMENTED / VERIFIED** — existing Store untouched; full typecheck + web build pass |

---

## 1. Scope of This Phase

Built the secure backend foundation that future Admin, Player Profiles, Store purchases,
Favorites, Applications and FiveM features build on. **Did NOT** build: the full Admin
Dashboard/UI, real payments (Tebex/Stripe/PayPal), FiveM integration, Orders, Tickets,
Applications backend — those remain future phases.

## 2. What Was Added (this phase)

### 2.1 PostgreSQL (Prisma)
- New ORM: **Prisma** (`@prisma/client` + `prisma` pinned to stable `6.19.3`).
- Schema (`apps/api/prisma/schema.prisma`) with entities: **User, DiscordAccount, Role,
  Permission, UserRole, UserPermission, Favorite** (Role↔Permission implicit m2m).
- **Migration** (`prisma/migrations/20260831120000_init/migration.sql`) written by hand and
  **validated** against Prisma's generated SQL via
  `prisma migrate diff --from-empty --to-schema-datamodel` (exact match, incl. the
  `_PermissionToRole_B_index`).
- **Seed** (`src/database/seed.ts`): creates ONLY the real system roles
  (OWNER, ADMIN, MODERATOR, CONTENT_MANAGER) and their permissions. **No fake user/player
  accounts** are seeded. Idempotent.

### 2.2 Discord OAuth2 (server-side)
- `GET /api/auth/discord` — sets a CSRF `state` nonce, redirects to Discord.
- `GET /api/auth/discord/callback` — validates `state`, exchanges the code **using the
  client secret server-side**, fetches the Discord profile, upserts **User +
  DiscordAccount**, establishes a session, redirects to the frontend.
- `POST /api/auth/logout`, `GET /api/auth/me`.
- Client secret never reaches the browser.

### 2.3 Session Security
- `express-session` + `connect-pg-simple` (PostgreSQL-backed store).
- Cookie: `HttpOnly`, `Secure` (default in prod), `SameSite` (`none` prod / `lax` dev),
  `maxAge` env-driven — configured in `apps/api/src/config/env.ts`.
- The session stores **only a userId**. Roles/permissions/Discord are resolved per request.

### 2.4 Authorization
- `src/middleware/auth.ts`: `getCurrentUser`, `requireAuth`, `requireRole(...)`,
  `requirePermission(...)`, `serializeUser`.
- `src/services/access.ts` + `src/services/permissions.ts` (pure, testable RBAC logic).
- **Owner bridge** via server-side `OWNER_DISCORD_IDS` env (comma-separated Discord ids).
  Owner can never be self-granted.

### 2.5 Admin roles & permissions
- `src/config/rbac.ts`: granular permissions (`admin.access`, `players.view`, `players.manage`,
  `store.view`, `store.manage`, `orders.*`, `applications.*`, `tickets.*`, `news.*`,
  `media.manage`, `server.view`, `admins.manage`, `settings.manage`) + per-role defaults.
- Permission set is evolvable (additive) via the DB.

### 2.6 CORS, Errors, Validation, Health
- CORS: allow-list **only** `CLIENT_ORIGIN` (+ localhost in dev), always `credentials: true`.
- Central `errorHandler`: sanitizes output (no stack/DB/Discord leak in prod).
- `src/lib/validate.ts`: validates OAuth code/state, product ids, strings.
- `GET /api/health` now also reports `api: healthy` + `database: connected | unavailable`
  (no secrets).

### 2.7 Store Favorites (backend foundation)
- `GET /api/store/favorites`, `POST /api/store/favorites/:productId`,
  `DELETE /api/store/favorites/:productId` (all `requireAuth`).
- `Favorite.productId` is a bare integer (no FK) this phase to avoid duplicating the static
  catalog / faking Product rows. Catalog-DB sync + `Product` entity = next Store phase.

### 2.8 Frontend auth
- `services/api.ts` — API client (`credentials: include`, no tokens in JS/localStorage).
- `features/auth/AuthContext.tsx` — `useAuth()` exposing `user`, `loading`,
  `authenticated`, `isAdmin`, `roles`, `login`, `logout`, `refresh`.
- `features/auth/UserMenu.tsx` — "LOGIN" button (logged out) / Discord avatar + username +
  Profile/Admin/Logout menu (logged in); desktop + mobile.
- `features/auth/RequireAdmin.tsx` + `pages/Admin.tsx` — `/admin` foundation route.
  Unauthenticated → login required; no admin access → denied; authorized → foundation loads.
  Backend independently enforces.

## 3. Environment Variables

`.env.example` updated with placeholders: `DATABASE_URL`, `DISCORD_CLIENT_ID`,
`DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `SESSION_SECRET`, `SESSION_SECURE`,
`SESSION_SAMESITE`, `COOKIE_DOMAIN`, `OWNER_DISCORD_IDS`, `CLIENT_ORIGIN`, `VITE_API_URL`.
**No real credentials committed** — `.env` is gitignored. `VITE_*` contains only the public
`VITE_API_URL`.

## 4. Tests — **VERIFIED (14/14 pass)**

```bash
npm test --workspace @hotpursuit/api
```

- `test/rbac.test.ts`: OWNER full access, ADMIN subset (no admins.manage/settings),
  MODERATOR limited, CONTENT_MANAGER news/media only, normal user zero admin perms,
  direct grants additive, dedup, `permits()`.
- `test/errors.test.ts`: sanitized prod errors (no internals), structured ApiError body,
  productId/authorizationCode/str validation.

> **BLOCKED (not faked):** live end-to-end auth (Discord buttons, callback, DB-backed
> sessions, favorites persistence) requires real credentials + a running PostgreSQL.

## 5. API Boot Verification — **VERIFIED (graceful degradation)**

Started the compiled/dev API with **no PostgreSQL available**:
- Server boots without crashing: `[hot-pursuit-api] development listening on :4123`.
- `GET /api/health` → **503** `{status:"degraded", api:"healthy", database:"unavailable"}` —
  safe, no DB details leaked.
- `GET /api/auth/me` → **401** for unauthenticated users (session absent → rejected).

## 6. Build & Typecheck Verification — **VERIFIED**

| Check | Result |
|---|---|
| `npm run typecheck` (all workspaces) | ✅ PASS |
| `npm run build --workspace @hotpursuit/api` | ✅ PASS |
| `npm run build --workspace @hotpursuit/web` | ✅ PASS (60 modules, JS 242.6 kB) |
| `npm test --workspace @hotpursuit/api` | ✅ 14/14 |
| Existing Store / favorites / filter logic | ✅ untouched (compiles + builds) |

## 7. Security Review — **done**

- **Discord secret exposure:** never in client / Vite env; used server-side only.
- **Session/cookie:** HttpOnly + Secure(prod) + SameSite; token not in localStorage.
- **CORS:** allow-list, `credentials`, never `*` for auth requests.
- **CSRF:** OAuth `state` nonce; SameSite cookies mitigate cross-site state changes.
- **API authorization / role escalation / id spoofing:** identity from session only;
  roles/perms resolved per request; clients can't assert `role`/`discordId`/`userId`.
- **SQL injection:** Prisma parameterized (`$queryRaw` only for health `SELECT 1`).
- **Input validation:** OAuth code/state, product ids, strings validated.
- **Error leakage:** sanitized centrally; no stack/DB/paths leaked in prod.
- **Owner:** only from `OWNER_DISCORD_IDS` / DB role; not self-grantable.

## 8. Honest Status of Each Requirement

**IMPLEMENTED:** DB schema + migration + seed (written & validated, apply BLOCKED),
server-side Discord OAuth, HTTP-only cookie sessions, `requireAuth`/`getCurrentUser`/
`requireRole`/`requirePermission`, Owner bridge, RBAC roles+permissions, CORS, error
handling, validation, `/api/health` DB state, favorites endpoints, frontend `useAuth`,
login UI, `/admin` foundation + guard, authorization unit tests, README, `.env.example`.

**PARTIAL:** Database applied/migrated (BLOCKED — no PostgreSQL in env), Discord
callback/user-creation/session-persistence live-tested (BLOCKED — no credentials),
favorites DB sync (backend ready, frontend still localStorage as designed for next phase).

**BLOCKED:** live Discord OAuth start/callback, user creation/login, session persistence,
DB-synced favorites round-trip — require Discord Developer credentials + a PostgreSQL
instance (per instructions, not faked).

**NOT IMPLEMENTED (per spec, deferred):** full Admin Dashboard/UI, admin management UI,
real payments (Tebex/Stripe/PayPal), FiveM APIs, Orders, Tickets, Applications backend,
News/Media backend, `Product` table/catalog sync, full player profile page.

## 9. Commands for the Human

```bash
# From hot-pursuit-platform/
npm install
# Configure .env from .env.example (DB + Discord + session + OWNER_DISCORD_IDS)

# Database (requires running PostgreSQL)
npm run db:generate --workspace @hotpursuit/api
npm run db:migrate   --workspace @hotpursuit/api   # applies + creates migration
npm run db:seed      --workspace @hotpursuit/api   # seeds OWNER/ADMIN/MODERATOR/CONTENT_MANAGER

# Run
npm run dev --workspace @hotpursuit/api   # http://localhost:4000
npm run dev:web                           # http://localhost:5173 (login via Discord)

# Verify
npm run typecheck
npm run build
npm test --workspace @hotpursuit/api
```

## 10. Next Actions (future phases)
1. Provide Discord Developer credentials → unblock live OAuth testing.
2. Provide a PostgreSQL instance → apply migration + seed, verify DB-backed sessions.
3. Store phase: migrate catalog to DB + add `Product` table/FK + sync Favorites for
   authenticated users.
4. Build the full Admin Dashboard/UI + admin management (moves ownership into DB).
5. Add browser E2E (Playwright) to close visual NOT-VERIFIED items.

## 11. Constraints Honored
- ✅ Did not break the existing Store (compiles + builds; behavior unchanged).
- ✅ CORS allow-list (no `*`), HTTP-only cookies, server-side OAuth secret.
- ✅ Never trusts client-supplied role/permissions/discordId/userId.
- ✅ No fake Discord users, sessions, DB connections, payments or FiveM data.
- ✅ Owner only from server config / DB role — not self-grantable.
- ✅ `.env` gitignored; no real credentials anywhere.
- ✅ Honest report — BLOCKED marked where the environment prevented real testing.
