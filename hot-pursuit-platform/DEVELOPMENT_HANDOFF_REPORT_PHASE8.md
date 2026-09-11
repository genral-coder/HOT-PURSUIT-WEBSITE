# DEVELOPMENT HANDOFF REPORT — PHASE 8

## Status Summary

| Area | Status |
|------|--------|
| PostgreSQL 17 (local) | ✅ REAL instance installed via winget, service `postgresql-x64-17` RUNNING on :5432, data at `C:\Program Files\PostgreSQL\17\data`. Role `hotpursuit` + DB `hot_pursuit` (UTF8, owner `hotpursuit`) created. Dev superuser password set (`hplocaldev`, local-only) |
| `apps/api/.env` | ✅ Created (gitignored — verified `git check-ignore`). `DATABASE_URL`, `SESSION_SECRET` (48-char), `SESSION_SECURE=false`, `SESSION_SAMESITE=lax`, `OWNER_DISCORD_IDS`, payment vars. `apps/api/.env.example` created with placeholders (commit-safe) |
| Migrations | ✅ 4/4 applied via `prisma migrate deploy` (`init`, `admin_audit`, `orders_payments`, `store_products`). **Bug found & fixed**: generator omitted the `id` PK column (P3018 null constraint) AND emitted `NOT NULL` for columns the schema declares nullable (`new`, `featured`, `likes` → P2011 on create). Both fixed in `generate-store-migration.ts`; failed migration resolved (`--rolled-back`); live columns corrected with `ALTER ... DROP NOT NULL` |
| Seed | ✅ Fixed `client.ts` to `import "dotenv/config"` (tsx scripts don't load `.env`); `npm run db:seed` → `[seed] roles, permissions, catalog and product prices synced.` |
| Live DB state | ✅ 4 categories / 40 products (39 catalog + 1 admin-CRUD test product `Phase8 Test Pass`) / 40 ProductPrice rows / 4 roles / Arabic intact (e.g. `توثيق الحساب`) |
| `verify:catalog` | ✅ Stage 1 (static) PASS + Stage 2 (live DB) PASS — no orphans, derived prices match registry |
| Health | ✅ `GET /api/health` → `{"status":"ok","database":"connected"}` |
| Store API | ✅ `GET /api/store/products` → 40 legacy-shape products (UTF-8 verified via node fetch), `GET /:id` → 200, archived `/999` → 404 `PRODUCT_NOT_FOUND` |
| Admin Products CRUD | ✅ LIVE against PostgreSQL: create (201, id auto-assigned), read (200), patch (200 + derived price row sync), delete-archive (200, hidden from store), restore (200). **Bug found & fixed**: DELETE passed `archive=true` to `setProductArchive` (inverted) so archiving left products available; fixed to `false` |
| Audit logging | ✅ `Product*` (create/update/archive) + `ORDER_STATUS_UPDATED` rows written to `AuditLog` with actor + before/after metadata |
| Sessions / auth | ✅ Real connect-pg-simple sessions in PostgreSQL. Signed-cookie flow verified through the REAL middleware: `/api/auth/me` resolves identity from the DB session, not the client. Logout (`POST /api/auth/logout`) destroys the session row. **RBAC boundary verified**: user with no roles gets empty permissions; owner bridge (`OWNER_DISCORD_IDS`) grants OWNER full access server-side |
| Orders | ✅ Admin list/detail against live DB (item count, item rows, user identity); transition machine enforced server-side (`PENDING→PAID→PROCESSING→COMPLETED→REFUNDED`, invalid PENDING→REFUNDED rejected); payment transitions enforced (`UNPAID→PAID`); all changes audit-logged |
| Favorites | ✅ Create (idempotent upsert), list (self-scoped), delete (idempotent, scoped to `userId` → cross-user IDOR denied). Persistence confirmed in `Favorite` table |
| Discord OAuth | 🔶 **BLOCKED — no real Discord credentials** (DISCORD_CLIENT_ID/SECRET empty). Verified graceful degradation: `GET /api/auth/discord` → 503 `oauth_not_configured`; callback → 401 `oauth_not_configured`. Flow + CSRF nonce + code exchange code paths exist and were NOT rewritten |
| API tests | ✅ 80/80 pass (`tsc --noEmit` green) |
| Web | ✅ `tsc --noEmit` green; `vite build` succeeds |
| Lint (root) | ✅ No errors (web/api have no eslint config; lint script is a no-op) |

---

## Known Issues / Notes for the next session

1. **Discord OAuth login is BLOCKED** until a real application is registered at https://discord.com/developers/applications and `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` are put in `apps/api/.env`. Until then `GET /api/auth/discord` returns 503 honestly — no fake login path was added.
2. **Authenticated RBAC/CRUD tests used real server-side sessions constructed in PostgreSQL** (session table populated with the exact payload the OAuth callback would store, cookie signed with the real `SESSION_SECRET`). This exercises the real middleware + connect-pg-simple + security bridge. It does NOT simulate the Discord token exchange. Documented as test identities:
   - `user_owner_test` / discordId `123456789012345678` (in `OWNER_DISCORD_IDS` → OWNER)
   - `user_normal_test` (no roles → empty permissions), `user_other_test` (used for cross-user IDOR checks)
3. **Test artifacts left in the dev DB on purpose** (useful for manual QA): product 40 `Phase8 Test Pass` (archive was exercised and restored), order `order_phase8_test` (taken to REFUNDED), owner + other session rows. Normal-user session was removed by the logout test.
4. **Hard rule honored — no fake success.** Every green status above is a real live-DB result. The one red frame (Discord OAuth) is reported BLOCKED, not workaround-claimed.
5. **Cookie signing gotcha**: `cookie-signature.sign()` returns `<sid>.<sig>` WITHOUT the `s:` prefix; express-session's `setcookie` prepends `s:` (`s:<sid>.<sig>`). When forging/verifying cookies manually, the header value must be `hp_session=s:...`.
6. **PowerShell gotchas** (kept in prior sessions): embedded quotes are stripped when passing SQL through psql args — write SQL to a `-f` file; avoid PowerShell `Set-Content`/`-replace` on UTF-8 files for real edits (Write tool only); PowerShell console mojibake is codepage display only (node fetch confirms real UTF-8).
7. **Session table** (`session`) is managed by connect-pg-simple (DDL: `sid varchar PK, sess json, expire timestamp(6)`), NOT by Prisma migrations — it is created on first use (`createTableIfMissing: true`).

---

## Files Created

### API

| File | Purpose |
|------|---------|
| `apps/api/.env` | Local runtime secrets (GITIGNORED — never commit): `DATABASE_URL=postgresql://hotpursuit:hplocaldev@localhost:5432/hot_pursuit?schema=public`, 48-char `SESSION_SECRET`, `OWNER_DISCORD_IDS=123456789012345678`, payment vars |
| `apps/api/.env.example` | Placeholder template (commit-safe) for all env vars incl. PostgreSQL, sessions, Discord OAuth, owner bridge, payments |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/scripts/generate-store-migration.ts` | Emit deterministic `prod_<id>` PK values in the INSERT column list; emit nullable `new`/`featured`/`likes` columns to match the Prisma schema (fixes P2011 on create) |
| `apps/api/prisma/migrations/20260911120000_store_products/migration.sql` | Regenerated: `id` first in INSERT column list with `prod_<n>` values; `new`/`featured`/`likes` nullable with defaults |
| `apps/api/src/database/client.ts` | Added `import "dotenv/config";` so tsx-run seed/scripts load `.env` |
| `apps/api/src/routes/adminProducts.ts` | Archive fix: DELETE now calls `setProductArchive(..., false)` (was `true` → left product available) |
| `apps/api/src/routes/favorites.ts` | Comment updated: favorites reference the canonical DB-backed catalog |

## Files NOT Modified (explicit)

- `apps/api/.env` is gitignored and NOT staged.
- Existing auth/RBAC/session stack (`middleware/auth.ts`, `config/env.ts`, `services/access.ts`, `services/orders.ts`, `routes/auth.ts`, `routes/adminOrders.ts`, `routes/favorites.ts`, `routes/orders.ts`, `routes/payments.ts`) — all phase 3–6 code, verified live but not rewritten.
- Web UI (Home/Store/public/admin/nav), `packages/config` translations, store catalog source. No store regression.

---

## PostgreSQL Environment (local dev)

- Service: `postgresql-x64-17` (running), port 5432, data dir `C:\Program Files\PostgreSQL\17\data`
- Binaries: `C:\Program Files\PostgreSQL\17\bin\psql.exe`
- Cluster (created manually, then deleted): `C:\Users\Computer City\hp-pgdata`
- Database: `hot_pursuit` (owner `hotpursuit`, UTF8). Role `hotpursuit` (password `hplocaldev`)
- postgres superuser password set to `hplocaldev` (dev-only); pg_hba.conf restored to scram-sha-256 after setup

## Live Migration / Seed / Verify Commands

```bash
# In apps/api (all against the real local PostgreSQL)
npx prisma migrate resolve --rolled-back 20260911120000_store_products   # after fixing the failed migration
npx prisma migrate deploy                                                # applies all 4 migrations
npm run db:seed                                                          # roles, permissions, catalog, prices
npm run verify:catalog                                                   # Stage 1 + Stage 2 => all PASS
npm run db:generate-products-migration                                   # regenerates offline migration SQL
npm run typecheck   && npm test && npm run build                         # 80/80 tests, builds green
```

## Live Runtime Verification Done

```text
GET /api/health                              → 200 { status:ok, database:connected }
GET /api/store/products                      → 200 (40 products, legacy shape)
GET /api/store/products/40                   → 200 (test product)
GET /api/store/products/999                  → 404 PRODUCT_NOT_FOUND
GET  /api/admin/products        (owner)      → 200 (list + pagination)
POST /api/admin/products        (owner)      → 201 (product 40 created, id server-assigned)
GET  /api/admin/products/40     (owner)      → 200 (full row + price)
PATCH /api/admin/products/40    (owner)      → 200 (price/amountCents synced to ProductPrice)
DELETE /api/admin/products/40   (owner)      → 200 (archived; product hidden from store, price unavailable)
PATCH /api/admin/products/40    (owner)      → 200 (restore)
GET  /api/admin/products        (normal)     → 403 forbidden   (RBAC boundary)
POST /api/admin/products        (normal)     → 403 forbidden
GET  /api/admin/orders          (normal)     → 403 forbidden
POST /api/store/favorites/40    (normal)     → 201 (idempotent upsert)
GET  /api/store/favorites       (normal)     → [40] (self-scoped)
GET  /api/store/favorites       (other/owner)→ []
DELETE /api/store/favorites/40   (other)      → 200, normal still has [40] (IDOR denied)
DELETE /api/store/favorites/40   (normal)     → 200, [] (cleanup confirmed in DB)
PATCH /api/admin/orders/<id>/status (owner)   → transitions enforced + audit rows
POST /api/auth/logout (normal)               → 200; session row removed from DB; /api/auth/me → 401
GET /api/auth/discord                        → 503 oauth_not_configured (BLOCKED honestly)
GET /api/auth/discord/callback               → 401 oauth_not_configured
GET /api/auth/me (unauth)                    → 401 auth_required
```

## How to Run

```bash
# Local API on :4000 (PostgreSQL service must be running)
cd apps/api
npx tsx src/index.ts          # or: Start-Process cmd /c "npx tsx src/index.ts > api-server.log 2>&1"
# Web on :5173
cd apps/web && npm run dev
```

## Remaining / Next Steps

1. Register a real Discord app, set `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` in `apps/api/.env`, then verify the full OAuth login + session establishment end-to-end.
2. Then verify `GET /api/auth/me` for a freshly-logged-in Discord owner vs non-owner, and confirm the session survives a server restart.
3. Optional: move ownership authority from the env bridge into PostgreSQL Admin Management (future phase), and remove the `OWNER_DISCORD_IDS` dev bridge.
4. Deploy-time checklist: replace `SESSION_SECURE=false`, `SESSION_SAMESITE=lax`, and dev passwords/secret with production values; `SESSION_SECURE=true`, `sameSite=none` on HTTPS.