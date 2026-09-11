# DEVELOPMENT HANDOFF REPORT — HOT PURSUIT RP Platform — PHASE 6

**Phase:** Payments & Orders System — real Orders domain, server-side pricing, payment-provider abstraction (dev-only mock), verified webhooks, My Orders + Admin Orders UI
**Date:** 2026-09-11
**Monorepo root:** `hot-pursuit-platform/` (separate git repo, branch `main`)
**Base commit:** `49a893d` (Phase 5 — Public Website Migration)

> **Honesty note:** This phase is **backend + tests + frontend**, all verifiable in this
> environment **except** runs that need live PostgreSQL / provider credentials. Those are
> explicitly flagged below (§4) and never emulated. No fabricated money, statuses, payment
> confirmations or provider credentials are anywhere in the codebase.

---

## 0. STATUS SUMMARY

| Status | Value |
|---|---|
| **ORDERS DOMAIN** | **IMPLEMENTED** — `Order` + `OrderItem` + `PaymentEvent` + `ProductPrice` schema, migration written |
| **TRUSTED PRICING** | **SERVER-SIDE ONLY** — client sends only product ids + quantities; `ProductPrice` registry re-prices everything |
| **PAYMENT PROVIDERS** | **ABSTRACTION READY** — interface + dev-only `MockPaymentProvider`; production wiring returns honest 503/`MANUAL` modes |
| **PAYMENT·WEBHOOK** | **VERIFIED + IDEMPOTENT** — HMAC signature check, `@@unique([provider, eventId])`, conditional transitions, amount verification |
| **ORDER STATUS MODELS** | **TRANSITION-CONTROLLED** — `ORDER_TRANSITIONS` / `PAYMENT_TRANSITIONS` maps asserted server-side |
| **TESTS** | **50/50 PASS** — incl. 19 new orders/payments tests |
| **API TYPECHECK** | **PASS (CLEAN)** — Prisma client generated, previous TS7006 noise resolved |
| **WEB TYPECHECK + BUILD** | **PASS** — typecheck clean; production build succeeds |
| **I18N COVERAGE** | **215 keys used, 0 missing** (EN/AR) |
| **LINT** | **PASS** |
| **MIGRATION** | **WRITTEN** (`20260911080000_orders_payments`) — applies on first live PostgreSQL run |
| **SEED** | **EXTENDED** — 39 `ProductPrice` rows (server-side price + billing + availability registry) |

---

## 1. Scope of This Phase

Built the real **orders + payments foundation** on top of the existing Discord Session
auth and RBAC from Phases 3–4. PurchaseModal now creates a real order through the API
instead of only opening Discord.

**Built:**
1. **Schema + migration** — `Order`, `OrderItem` (snapshot name/nameAr/image), `PaymentEvent`
   (idempotency key `@@unique([provider, eventId])`), `ProductPrice` (trusted registry);
   `User.orders`, `Order.paymentEvents` relations; `OrderStatus`, `PaymentStatus`,
   `PaymentProviderType`, `Billing` enums. Migration SQL written and validated.
2. **Order service** (`services/orders.ts`) — order numbers (`HP-XXXXXX`), server-side
   pricing (`priceOrderLines`), controlled status-transition maps + assertions,
   `MAX_ORDER_ITEM_QUANTITY`, full Phase-6 error codes.
3. **Provider abstraction** (`services/payments/providers.ts`) — `PaymentProvider`
   interface, `MockPaymentProvider` (dev-only, refuses production), `signMockWebhook`
   inside mock-dev mode, `getPaymentProvider()` (empty → MANUAL, mock → dev, unwired →
   503 `PAYMENT_PROVIDER_NOT_CONFIGURED`).
4. **Webhook processor** (`services/payments/processor.ts`) — signature verification,
   amount verification, idempotent processing, `$transaction` audit `PAYMENT_WEBHOOK_PROCESSED`.
5. **Routes** — POST `/api/orders` (server-repriced, provider session), GET `/api/orders`
   (own list), GET `/api/orders/:id` (owner + `orders.view` staff), POST
   `/api/payments/webhook` (signed, raw-body), GET `/api/payments/dev-checkout` (dev-only
   mock simulator), `/api/admin/orders` (list/detail/`PATCH /:id/status` with
   `orders.manage` + transition assertions). Mounted in `server/app.ts` with a
   raw-body capture hook; `express.json` verify validated.
6. **Seed** — `CATALOG_PRICES` (39 entries) upserted as `ProductPrice` (amountCents,
   billing, availability; sold-out ids 6,10,11,12,18,22,26,30).
7. **Tests** — `test/orders.test.ts` (11) + `test/payments.test.ts` (8) + all prior suites.
8. **Frontend** — `pages/Orders.tsx` (My Orders), `pages/OrderDetail.tsx`,
   `pages/admin/Orders.tsx` (filters, pagination, detail modal, status actions);
   routes `/orders`, `/orders/:id`, real `/admin/orders`; UserMenu "My Orders" link;
   AdminLayout orders item un-flags; **PurchaseModal now creates a real order** and opens
   the provider checkout URL when available, else the legacy Discord ticket fallback
   (provider stays MANUAL; nothing is marked paid without a real webhook).

**Did NOT build (by design):**
- No real Stripe/PayPal/Tebex server implementations — only the prepared interface and
  the dev-only mock simulator, so nothing fake can ever mark an order paid.
- No fake payment confirmations, calls, or numbers anywhere.
- Migration not yet applied to a live PostgreSQL (none available here); it is statically
  validated and ready for `prisma migrate deploy`.

## 2. Decision Summary (how payments behave)

1. **Trust boundary** — the client sends `{ items: [{ productId, quantity }] }` only.
   `priceOrderLines` resolves each id against `ProductPrice` (amount, billing, snapshot
   names/image), rejects empty carts, unknown/sold-out products, bad quantities and
   duplicates, and computes subtotal/discount/total in integer cents. Nothing from the
   client is trusted for price, total, availability or status.
2. **Checkout flow** — create order (status `PENDING`, paymentStatus `UNPAID`) → if a
   provider is configured, create a checkout session (stored in `providerOrderId`) and
   return `checkoutUrl` → the browser opens it. The order becomes `PAID` **only** when a
   verified, idempotent, server-to-server webhook event marks it so.
3. **MANUAL mode** — empty `PAYMENT_PROVIDER` is a valid, honest mode: the order is
   recorded and shown in My Orders, no checkout URL is returned, and the frontend falls
   back to the legacy Discord ticket flow. The order is **never** auto-paid.
4. **Webhook integrity** — signature `sha256=HMAC(PAYMENT_WEBHOOK_SECRET, rawBody)`
   compared with timing-safe equality; amount must match `totalCents` exactly;
   `PaymentEvent` unique `(provider, eventId)` guarantees idempotent processing; only
   legal transitions are applied (e.g. `UNPAID → PAID`).
5. **RBAC for admin orders** — list/detail require `orders.view`; status changes require
   `orders.manage` and still pass the server-side transition maps + audit
   `ORDER_STATUS_UPDATED`.
6. **Dev simulator** — `GET /api/payments/dev-checkout?session=…` (mock provider only)
   emits a correctly signed `payment.completed` webhook through the real endpoint,
   exercising the full pipeline without touching production.

## 3. What Was Added (this phase)

### 3.1 Schema & migration
- `apps/api/prisma/schema.prisma` — enums `OrderStatus`, `PaymentStatus`,
  `PaymentProviderType`, `Billing`; models `Order`, `OrderItem`, `PaymentEvent`,
  `ProductPrice`; `User.orders`; `@@unique([provider, eventId])`.
- `apps/api/prisma/migrations/20260911080000_orders_payments/migration.sql`.

### 3.2 Backend services & routes
- `apps/api/src/services/orders.ts` — pricing, order numbers, transition maps.
- `apps/api/src/services/payments/providers.ts` — provider interface + mock + resolution.
- `apps/api/src/services/payments/processor.ts` — webhook processor.
- `apps/api/src/routes/orders.ts`, `routes/payments.ts`, `routes/adminOrders.ts`.
- `apps/api/src/server/app.ts` — mounts + `express.json` raw-body `verify` hook.
- `apps/api/src/config/env.ts` + root `.env.example` — `PAYMENT_PROVIDER`,
  `PAYMENT_CURRENCY`, `PAYMENT_WEBHOOK_SECRET`, `API_BASE_URL` (+ commented provider slots).
- `apps/api/src/database/seed.ts` — `CATALOG_PRICES` + `seedProductPrices()`.
- `apps/api/src/lib/errors.ts` — `isUniqueConstraintError` (P2002).

### 3.3 Shared types
- `packages/types/src/index.ts` — real `Order`, `OrderItem`, `OrderStatus`, `PaymentStatus`,
  `PaymentProviderType`, `Billing`, `CheckoutItem`, `CreateOrderResult`, `OrderSummary`,
  `AdminOrderRow`, `PagedOrders`; `AuditAction` extended.

### 3.4 Frontend
- `apps/web/src/services/api.ts` — `createOrder`, `fetchMyOrders`, `fetchOrder`,
  `fetchAdminOrders`/`AdminOrderQuery`, `fetchAdminOrder`, `updateAdminOrderStatus`.
- `apps/web/src/pages/Orders.tsx`, `pages/OrderDetail.tsx`, `pages/admin/Orders.tsx`.
- `apps/web/src/App.tsx` — `/orders`, `/orders/:id`, real `/admin/orders`.
- `apps/web/src/features/auth/UserMenu.tsx` — "My Orders" item.
- `apps/web/src/features/admin/AdminLayout.tsx` — orders item no longer "coming soon".
- `apps/web/src/features/store/PurchaseModal.tsx` — real checkout integration.
- `packages/config/src/i18n.ts` — ~40 Phase-6 keys (EN/AR) incl. generated sets
  `orderStatus_*`, `paymentStatus_*`, `provider_*`.

## 4. Honesty & Limits

- **Payment provider integration is prepared but production credentials are not configured.**
  With `PAYMENT_PROVIDER=` (default) checkout is MANUAL-backed; with `stripe`/`paypal`/
  `tebex` set it returns a truthful 503 `PAYMENT_PROVIDER_NOT_CONFIGURED` until a real
  implementation is registered. `mock` is refused outside development (`NODE_ENV!==development`).
- **No live PostgreSQL here** — migration is written/validated but **not applied**; it
  applies via `npm run db:deploy` on the real database.
- Discord OAuth and live admin DB round-trips remain blocked exactly as before — nothing
  about them was faked in this phase.
- Every order piece visible in the UI comes from the backend; the client shows honest
  loading/error/empty states and never fabricates totals, statuses or payment refs.

## 5. Verification Run

| Check | Command | Result |
|---|---|---|
| API typecheck | `npm run typecheck` (in `apps/api`) | **PASS (clean)** |
| API tests | `npm test` (in `apps/api`) | **50/50 PASS** (incl. 11 orders + 8 payments) |
| Web typecheck | `npm run typecheck --workspace @hotpursuit/web` | **PASS** |
| Web build | `npm run build --workspace @hotpursuit/web` | **PASS** — 82 modules, JS 319.63 kB (gzip 92.88), CSS 26.01 kB |
| Migration validation | `prisma validate` (dummy URL) | **PASS** |
| Lint | `npm run lint` | **PASS** |
| i18n coverage | script scan `t("...")` vs dict | **215 used / 0 missing** (dynamic `orderStatus_*`/`paymentStatus_*`/`provider_*` sets present) |

## 6. Tech Debt / Notes (carried forward)

- Migration + real provider flow require live PostgreSQL and provider credentials; both
  gated on the production environment, not code.
- `MANUAL` mode keeps the Discord-ticket fallback for record-keeping; a future step can
  auto-open exact Discord DM/threads per order number.
- No refund reversal flow against a provider yet (`order` status can go `REFUNDED`, but no
  automated gateway refund call is wired — intentionally out of scope).
- Browser routing still uses `BrowserRouter` without `basename` (unchanged GH-Pages note).
- The previously deprecated legacy token is **not** reintroduced anywhere.

## 7. Suggested Next Phase

1. **Real provider wiring** — implement the `PaymentProvider` contract for Stripe/Tebex/
   PayPal with live keys; apply migration on the real DB; keep `MANUAL` fallback.
2. **Store admin** — manage `ProductPrice` (prices, availability) from `/admin/store`
   instead of the static catalog.
3. **News & Media CMS** — replace sample/empty states with staff-managed content.
4. **Applications & Support tickets** — real submission backend (Discord webhooks/DB).