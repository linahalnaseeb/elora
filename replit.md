# ELORA Accessories Store

ELORA is a warm, editorial accessories storefront with a curated catalog, cart, and Stripe test checkout.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/elora-store run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query
- API: Express 5 + typed OpenAPI contract
- Payments: Stripe through the Replit-managed connector
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/elora-store/src/App.tsx` — storefront pages, product browsing, cart, and checkout UI
- `artifacts/elora-store/src/index.css` — ELORA visual system and responsive styling
- `artifacts/api-server/src/catalog.ts` — server-owned accessory catalog
- `artifacts/api-server/src/routes/store.ts` — catalog, summary, and checkout endpoints
- `artifacts/api-server/src/stripe-client.ts` — Stripe connector requests and test Checkout Sessions
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client

## Architecture decisions

- The storefront uses generated OpenAPI hooks so the browser and Express API share one contract.
- Stripe Products and Prices are created through the managed Stripe connection and reused during checkout; credentials never live in source code.
- The product catalog is intentionally server-owned and lightweight for the first storefront build; checkout is the source of truth for payment totals.

## Product

- Browse featured ELORA accessories and filter by category.
- Open a quick product view and add items to a cart.
- Start a Stripe Checkout Session in test mode.
- See success and cancellation states after returning from checkout.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
