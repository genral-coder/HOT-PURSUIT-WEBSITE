# HOT PURSUIT RP — Platform monorepo

Production rewrite of the HOT PURSUIT RP FiveM community website.
Migrates the legacy vanilla-JS site into a typed, full-stack monorepo while
preserving branding, EN/AR + RTL support, and 100% of store data.

## Stack

- `apps/web` — React 18 + TypeScript + Vite + Tailwind (dark-cinematic HOT PURSUIT theme)
- `apps/api` — Node.js + Express + TypeScript (REST)
- `packages/types` — shared domain types
- `packages/config` — design tokens + i18n dictionary (EN/AR)
- `packages/shared` — framework-agnostic utilities
- Future: PostgreSQL + Discord OAuth2 (server-side), admin/orders modules

## Getting started

Node.js 20+ is required.

```bash
npm install        # from the repo root (installs all workspaces)
npm run dev:web    # start the web dev server (http://localhost:5173)
npm run typecheck  # typecheck every workspace
npm run build      # production build (web)
```

## Environment

Copy `.env.example` to `.env` and fill real values. **Never commit the real
`.env`.** The Discord Client Secret must only ever be used server-side.

## Design notes

- Do **not** ship fake production data. Empty links render as “coming soon”.
- Admin authorization is **server-side only**; never trust client-side roles.
- Rules are intentionally **not** in the main navigation.
- RTL/Arabic use logical properties so layout stays correct in both languages.

## Data migration

39 products and 34 images were migrated verbatim from the legacy
`products.json` / `images/` into `apps/web/src/data` and `apps/web/public`.
