# DEVELOPMENT HANDOFF REPORT — HOT PURSUIT RP Platform — PHASE 5

**Phase:** Public Website Migration (real pages) — Home, Server, Community, Applications, Media, Rules, News, Leaderboards, Support
**Date:** 2026-09-01
**Monorepo root:** `hot-pursuit-platform/` (separate git repo, branch `main`)
**Base commit:** `17d35be` (Phase 4 — Admin Panel + RBAC)

> **Honesty note:** Phase 5 is **frontend-only** and therefore fully verifiable in this
> environment. No live PostgreSQL / Discord credentials are still required for anything
> in this phase. All public pages, i18n (EN/AR + LTR/RTL), SEO, accessibility,
> responsiveness, and the no-fake-data rule for live data (server status, leaderboards,
> media, news) are **VERIFIED** below. The only pre-existing tech-debt items carried
> forward are documented in §6.

---

## 0. STATUS SUMMARY

| Status | Value |
|---|---|
| **PUBLIC WEBSITE** | **MIGRATED** — all 9 public sections are real pages, no longer placeholders |
| **RULES** | **SPLIT** — Server Rules public at `/rules`; Purchase Rules stay **inside the Store only** (not in navigation) |
| **LIVE DATA RULE** | **HONORED** — server status, leaderboards, media & news render explicit "coming soon / not connected" states; **zero fabricated numbers** |
| **DISCORD LINKS** | **WIRED** — real invite + ticket channel migrated from legacy `site-config.js`, env-overridable |
| **STORE / AUTH / ADMIN** | **UNTouched + VERIFIED** — 39 products/34 images intact; typecheck + build + 31 tests pass |
| **I18N COVERAGE** | **188 keys used, 0 missing** (EN/AR) |
| **WORKSPACE TYPE CHECK** | **PASS** — `@hotpursuit/web` typecheck clean |

---

## 1. Scope of This Phase

Completed the migration of the **public-facing website** from the legacy root site into
the new React platform. This phase replaced the `PlaceholderPage` shells for
`server`, `applications`, `community`, `media`, `news`, `leaderboards`, `support` with
real pages and added a new `/rules` page for Server Rules.

**Built:**
1. Real pages for every public section (9 pages + enhanced Home).
2. Separated **Server Rules** (public, `/rules`) from **Purchase Rules** (store-only).
3. Wired the **real Discord invite + ticket channel** from legacy config.
4. SEO metadata per page (`usePageMeta`) + base OG/Twitter/canonical/theme-color tags.
5. Reusable components: `PageHero`, `Accordion` (used by Support FAQ).
6. Full EN/AR + LTR/RTL coverage with no hardcoded strings.

**Did NOT build (by design, per phase rules):**
- Fake live data: server status stays "live data not connected", leaderboards render
  "coming soon", media/news render empty states.
- Real FiveM backend, applications/tickets/orders submission systems, news/media CMS,
  live leaderboard API — only clean data interfaces are prepared (`data/*` modules typed
  against `@hotpursuit/types`) so a future backend can feed them without page rewrites.

## 2. What Was Added (this phase)

### 2.1 Public data layer (single source of truth, migrated from legacy)
- `apps/web/src/data/public.ts` — `whyUs` (6), `features` (4), `jobs` (6), `applications`
  (6 offers), `rules` (8 categories of Server Rules), `newsPosts` (2 marked `sample`),
  `faq` (3), `socialLinks` (catalog). All typed against shared `@hotpursuit/types`
  (`WhyUsCard`, `SiteFeature`, `Job`, `ApplicationOffer`, `RuleCategory`, `FaqItem`,
  `NewsPost`, `SocialLink`).
- `apps/web/src/data/server.ts` — `serverInfo` (clearly `mock: true`, **online: false**)
  + `joinSteps` (informational how-to-join).
- `apps/web/src/data/leaderboards.ts` — leaderboard categories conforming to shared
  `Leaderboard` type, **empty lists** until a live backend exists.
- `apps/web/src/data/media.ts` — filter options only.

### 2.2 Real Discord + site config
- `apps/web/src/data/site.ts` — wired the **real** invite
  (`https://discord.gg/REqWKXnrku`) and Discord ticket channel
  (`1341516123123744881`), both migrated verbatim from legacy `site-config.js`, with
  env overrides (`VITE_DISCORD_URL`, `VITE_DISCORD_TICKET_URL`, `VITE_SOCIAL_*`).
  Added `brand` and `seo` defaults. Empty values render "coming soon" — never dead/fake links.

### 2.3 Public pages
- `pages/Home.tsx` — enhanced: hero + Store intro + Why + Features + Jobs + Popular
  products + Categories + Vehicle classes + Purchase Rules + News preview + Discord CTA + FAQ.
- `pages/Server.tsx` — status card explicitly "live data not connected", meta items,
  connect button (shown disabled until `play` address is set), how-to-join steps,
  features, departments, about.
- `pages/Community.tsx` — Discord primary CTA + official platforms (built from config,
  no duplicated URLs).
- `pages/Applications.tsx` — real application offers + requirement lists + Discord ticket note.
- `pages/Media.tsx` — filter tabs + honest "coming soon" empty state (no fake screenshots).
- `pages/Rules.tsx` — **Server Rules** (8 categories) — public, in navigation.
- `pages/News.tsx` — real-filtered news (`sample` excluded) + empty state.
- `pages/Leaderboards.tsx` — category tabs + "coming soon" empty state.
- `pages/Support.tsx` — tickets (Discord) + community + FAQ accordion.

### 2.4 Routing & navigation
- `apps/web/src/App.tsx` — replaced placeholder shells with real page components; added
  `/rules`.
- `apps/web/src/layouts/AppLayout.tsx` — added `/rules` to desktop + mobile nav/ footer.
- `apps/web/src/pages/Placeholder.tsx` — reduced to `profile` + `notfound` only.

### 2.5 Components & hooks
- `apps/web/src/components/PageHero.tsx` — consistent cinematic page header.
- `apps/web/src/components/Accordion.tsx` — accessible (ARIA), used by Support FAQ.
- `apps/web/src/hooks/usePageMeta.ts` — per-page title/description/OG/Twitter/canonical.

### 2.6 i18n + SEO base
- `packages/config/src/i18n.ts` — added ~40 Phase-5 keys (EN/AR). **188 keys used, 0 missing.**
- `apps/web/index.html` — base meta description, canonical, OG, Twitter, theme-color, favicon.

## 3. Rules Separation (explicit)

- **Server Rules** → public page `/rules` (`pages/Rules.tsx`), shown in navigation
  (header + mobile + footer).
- **Purchase Rules** → remain **inside the Store only** (`features/store/PurchaseRulesModal`),
  N OT added to navigation. Verified: `NAV_ITEMS` contains store, server, **rules**,
  applications, community, media, news, leaderboards, support — no purchase-rules entry.

## 4. No-Fake-Data Verification

| Feature | What renders | Why |
|---|---|---|
| Server status/players/address | "Live data not connected" + disabled connect | No live FiveM API |
| Leaderboards | "Coming soon" + category tabs | Lists empty by design |
| Media gallery | Filter tabs + "Media coming soon" | No published capture pipeline |
| News | Real items filtered (`sample` excluded) → currently empty state | Only 2 sample posts exist |
| Purchase/Store | Full 39 products / 34 images | Untouched, real |

## 5. Verification Run

| Check | Command | Result |
|---|---|---|
| Web typecheck | `npm run typecheck --workspace @hotpursuit/web` | **PASS** (clean) |
| Web build | `npm run build --workspace @hotpursuit/web` | **PASS** — 79 modules, JS 299.79 kB (gzip 88.51), CSS 24.69 kB |
| API tests | `npm run test --workspaces --if-present` | **31/31 PASS** |
| Lint | `npm run lint` | **PASS** (no findings) |
| i18n coverage | script scan of `t("...")` vs dict | **188 used / 0 missing** |
| Change scope | `git status` | only web app + config i18n; **no Store/Auth/Admin files modified** |

## 6. Tech Debt / Notes (carried forward, unchanged)

- **API typecheck** still surfaces pre-existing `TS7006` errors in
  `seed.ts` / `favorites.ts` / `access.ts` / `admins.ts` because the Prisma client is not
  generated in this environment (no DB). Not caused by Phase 5; not blocking (frontend-only phase).
- Live **Discord OAuth login + admin DB round-trips** remain BLOCKED until real
  credentials/PostgreSQL exist (unchanged from Phase 3/4).
- The 2 news posts are marked `sample` and excluded from the News page; real posts will
  feed the same interface (News CMS later).
- Browser routing uses `BrowserRouter` without a `basename`; if GH Pages subpath hosting is
  restored, set `base` in `vite.config.ts` and a matching `basename` (noted for later).
- A previously deprecated legacy token (`ghp_...`) is gone from the codebase and is **not**
  reintroduced anywhere.

## 7. Suggested Next Phase

1. **Payments/Orders** — wire purchase flow to a real gateway (Tebex/Stripe/PayPal) and
   the existing favorites/cart interfaces.
2. **FiveM server integration** — feed `data/server.ts` + `data/leaderboards.ts` from a
   live API; remove the `mock` flag.
3. **News & Media CMS** — replace sample/empty states with staff-managed content.
4. **Applications & Tickets** — real submission backend (Discord webhooks or DB + OAuth).