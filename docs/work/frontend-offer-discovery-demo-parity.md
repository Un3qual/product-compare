# Frontend Offer Discovery Demo Parity Work Doc

## Snapshot

- Status: done
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-08 after Commerce Offer Interaction focused offer
  route verification
- Implementation plan:
  - `docs/plans/2026-06-01-frontend-offer-discovery-demo-parity-implementation-plan.md`
- Recently completed usable-product plan:
  - `docs/plans/2026-06-29-offer-discovery-product-context-implementation-plan.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-offer-discovery-filter-controls-implementation-plan.md`
- Objective:
  - Make the existing top-level GraphQL `merchantProducts(input:)` contract demoable from a dedicated frontend route without requiring manual GraphQL queries or URL ID editing.

## Current Usable Product Batch

- Status: done.
- Plan:
  `docs/plans/2026-06-29-offer-discovery-product-context-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/offers/index.tsx`
  - `assets/test/routes/offers/offer-discovery-loader.test.ts`
  - `assets/test/routes/offers/offer-discovery.route.test.tsx`
  - `docs/work/frontend-offer-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/offers` shows active filter context, reset actions, and a
  path back to product selection without backend query changes.
- Completed evidence:
  - RED: `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx` -
    13 tests, 4 expected failures for missing product guidance, active-filter
    summary, reset links, and error-state filter context.
  - GREEN: `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx` -
    22 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Commerce Offer Interaction Batch

- Status: done.
- Owned paths:
  - `assets/schema.graphql`
  - `assets/src/routes/products/**`
  - `assets/src/routes/offers/**`
  - related product/offers route tests
  - `docs/work/frontend-offer-discovery-demo-parity.md`
- Scope:
  - Product detail and `/offers` merchant actions now use the first-party
    `trackCommerceClick` GraphQL mutation and submit only `merchantProductId`.
  - `/offers` derives visible merchant quick filters from loaded offer rows,
    labels the active merchant filter from the visible merchant name when
    available, preserves `productId`, `activeOnly`, `first`, and `sort`, and
    drops stale `after` cursors when applying a merchant filter.
  - Unsafe offer rows remain filtered out by the existing safe URL gate; null
    merchant rows keep their fallback merchant action label and do not create
    merchant filter links.
- Guardrails:
  - No raw destination URL is accepted from the browser.
  - eBay Browse fallback, ingestion dashboard/operator surfaces, live provider
    credentials/application work, Tier-3 scraping, and CSV export remain out of
    scope.
- Evidence:
  - RED:
    `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx test/routes/offers/offer-discovery-loader.test.ts` -
    14 expected failures for missing mutation-backed merchant actions and
    missing row merchant quick filters.
  - GREEN:
    `cd assets && bun run relay` - completed and compiled 32 reader, 31
    normalization, and 31 operation text documents.
  - GREEN:
    `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx test/routes/offers/offer-discovery-loader.test.ts` -
    84 tests, 0 failures.
  - Final:
    `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - Final: `git diff --check` - completed with exit 0.

## Completed Product-Facing Batch

- Status: done.
- Plan:
  `docs/plans/2026-07-02-offer-discovery-sort-and-highlights-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/offers/loader.ts`
  - `assets/src/routes/offers/paths.ts`
  - `assets/src/routes/offers/filters.tsx`
  - `assets/src/routes/offers/index.tsx`
  - `assets/test/routes/offers/offer-discovery-loader.test.ts`
  - `assets/test/routes/offers/offer-discovery.route.test.tsx`
  - `docs/work/frontend-offer-discovery-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/offers` preserves existing filters and pagination while
  adding loaded-page sort and page-local best-price highlighting.

### Offer Discovery Sort And Highlights Evidence

- RED: `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx` -
  29 tests, 20 expected failures for missing sort normalization, sort controls,
  sort-preserving links, loaded-page sorting, and best-price labeling.
- GREEN: `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx` -
  29 tests, 0 failures, including price low-to-high `Best price on this page`
  labeling and price high-to-low `Highest price on this page` labeling.
- Final integration: `cd assets && bun run typecheck` - completed with exit 0.
- `git diff --check` - completed with exit 0.

## Current Cross-Project Batch

- Status: done.
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
- Completed verification:
  - `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx` - 19 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

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
  - The 2026-06-27 visible filter control follow-up is complete.

## Verification Commands

- `cd assets && bun run relay`
- `cd assets && bun x vitest run src/routes/offers/__tests__/offer-discovery-loader.test.ts src/routes/offers/__tests__/offer-discovery.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`
- `cd assets && bun run typecheck`
- `mix test test/product_compare_web/graphql/pricing_queries_test.exs`
- `cd assets && bun run check`
- `git diff --check`

## Just Completed

- 2026-06-29 usable-product Task 4:
  - Added a route-local active-filter summary for `/offers` showing the selected
    product ID, merchant ID when present, offer status, and page size from
    loader-normalized filters.
  - Added reset and clear-merchant links that preserve the existing URL-filter
    behavior without changing Relay variables, backend input shape, or cursor
    pagination links.
  - Improved the missing-product state with clearer product-selection guidance
    while preserving the `/products` path.
  - Verified focused route/loader coverage, frontend typecheck, and whitespace
    checks.

- Task 6:
  - Added visible `/offers` filter controls for `productId`, `merchantId`, `active-only`,
    and `first` as a route-local GET form.
  - Added route and loader regressions for active-only false, page size and merchant filters,
    and cursor normalization.
  - Confirmed pagination links preserve `productId`, `merchantId`, `activeOnly`, and `first`.

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
