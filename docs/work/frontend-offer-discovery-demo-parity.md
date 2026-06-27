# Frontend Offer Discovery Demo Parity Work Doc

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 during Task 4 final verification
- Implementation plan:
  - `docs/plans/2026-06-01-frontend-offer-discovery-demo-parity-implementation-plan.md`
- Current implementation plan:
  - `docs/plans/2026-06-27-project-offer-discovery-filter-controls-implementation-plan.md`
- Objective:
  - Make the existing top-level GraphQL `merchantProducts(input:)` contract demoable from a dedicated frontend route without requiring manual GraphQL queries or URL ID editing.

## Current Cross-Project Batch

- Status: ready.
- Plan: `docs/plans/2026-06-27-project-offer-discovery-filter-controls-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/offers/index.tsx`
  - `assets/test/routes/offers/offer-discovery.route.test.tsx`
  - `assets/test/routes/offers/offer-discovery-loader.test.ts`
  - `docs/work/frontend-offer-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/offers` exposes existing product, merchant, active-only, and page-size filters in the UI.

## Verified Current State

- Backend GraphQL already exposes `merchantProducts(input:)` with product, merchant, active-only, cursor, latest-price, price-history, and public active-coupon coverage in `test/product_compare_web/graphql/pricing_queries_test.exs`.
- `/products/:slug` already preloads active offers for one product through `ProductOffersRouteQuery`.
- Product browse cards already have product global IDs through `BrowseProductsRouteQuery`, which can link to an offer-discovery route with a valid `productId` query param.
- `/offers` now preloads and renders offer rows through the top-level `merchantProducts(input:)` query.

## Previous Steady State

- Status: completed.
- Batch: initial offer-discovery route registration and demo parity.
- Scope:
  - The 2026-06-01 offer-discovery route batch is complete.
  - The current cross-project follow-up is listed above and dispatched from
    `docs/work/index.md`.

## Verification Commands

- `cd assets && bun run relay`
- `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts src/routes/offers/__tests__/offer-discovery.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`
- `cd assets && bun run typecheck`
- `mix test test/product_compare_web/graphql/pricing_queries_test.exs`
- `cd assets && bun run check`
- `git diff --check`

## Just Completed

- Task 1:
  - Added `OfferDiscoveryRouteQuery`, `offerDiscoveryLoader`, and focused loader coverage for missing `productId`, default active-offer variables, explicit merchant/cursor filters, invalid and malformed page sizes, and recoverable preload failures.
  - Generated `assets/src/__generated__/OfferDiscoveryRouteQuery.graphql.ts`.
  - Verified `cd assets && bun run relay` and `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts`.

- Task 2:
  - Added `OfferDiscoveryRoute` and focused route coverage for missing-product, ready rows, inactive rows, empty state, next/first pagination links, loader errors, and query-unavailable fallback.
  - Added nullable active-coupon and price-history fallbacks so offer route rendering stays typecheck-clean.
  - Cleared small frontend typecheck blockers in `assets/vitest.config.ts` and the product detail duplicate-key test helper.
  - Verified `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts src/routes/offers/__tests__/offer-discovery.route.test.tsx` and `cd assets && bun run typecheck`.

- Task 3:
  - Registered `/offers` with `offerDiscoveryLoader`, `OfferDiscoveryRoute`, and a route-level error boundary.
  - Added `Offers` links to primary navigation and home actions.
  - Added product browse card links to `/offers?productId=<product-id>`.
  - Verified the RED/GREEN route-entry loop with `cd assets && bun x vitest run src/__tests__/router.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`.

- Task 4:
  - Ran `cd assets && bun run relay`.
  - Ran focused offer-discovery, browse, root, and router Vitest coverage.
  - Ran `cd assets && bun run typecheck`.
  - Ran `mix test test/product_compare_web/graphql/pricing_queries_test.exs` after installing Elixir deps and starting the local Postgres service.
  - Ran `cd assets && bun run check`; this required a test-harness-only FormData constructor compatibility fix in the existing API-token route tests after the current Vitest version rejected a non-constructable mock.
