# Frontend Product Offers Work Doc

## Snapshot

- Status: complete (product offer panel data contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after product-offer panel data-contract extraction
  (59 focused pure and product-detail route tests)
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`
- Definition of done:
  - The frontend renders an `Active offers` section on `/products/:slug` from the existing GraphQL pricing surface.
  - The detail route preserves product-level ready/not-found/unavailable behavior while distinguishing offers ready, empty, and unavailable states locally.
  - Route-level tests cover offer success, empty, and unavailable states without widening the route beyond the current pricing baseline.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Product Offer Panel Data Contract

- Status: complete on 2026-07-14 on `codex/route-policy-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Completed action: isolated offer normalization, coupon and price-history row
  construction, snapshot display values, and pagination paths in a
  framework-free module while retaining panel markup, accessibility, and list
  presentation.
- Owned paths:
  - `assets/src/routes/products/product-offer-panel-data.ts`
  - `assets/src/routes/products/ProductOfferPanel.tsx`
  - `assets/src/routes/products/ProductOfferList.tsx`
  - `assets/test/routes/products/product-offer-panel-data.test.ts`
  - `docs/work/frontend-product-offers.md`
- Verification completed:
  - `cd assets && bun x vitest run test/routes/products/product-offer-panel-data.test.ts test/routes/products/detail.route.test.tsx`
    passed 59 tests.
  - `cd assets && bun run typecheck` passed.
  - The direct/transitive import scan of `product-offer-panel-data.ts` and its
    pure dependencies found no React, Relay, router, StyleX, or Radix imports.
  - `git diff --check` passed.
- Exit evidence: pure offer-panel data preserves unsafe-URL exclusion,
  merchant fallbacks, price and currency validation, coupon and price-history
  semantics, snapshot display values, compare-slug ordering, and pagination
  paths.
- Candidate evidence: current source inspection found the deterministic data
  transformation and path policy embedded in the 300-line React panel, and the
  existing product-detail route suite passed 55 tests.

## Verified Current State

- `assets/src/routes/products/loader.ts` reads the `offersAfter` cursor and
  preloads the combined `ProductDetailRouteQuery`, which includes the product
  and its active `merchantProducts` connection. It preserves route-level
  `ready`, `not_found`, and `error` states from that one Relay preload.
- `assets/src/routes/products/ProductDetailRoute.tsx` retains the route shell,
  product fallbacks, and `Active offers` tab, then passes the Relay connection
  and URL cursor state to `ProductOfferPanel`.
- `assets/src/routes/products/ProductOfferPanel.tsx` owns local unavailable,
  empty, snapshot, and offer-page behavior; `ProductOfferList.tsx` presents
  normalized offer rows, prices, price history, coupons, and tracked merchant
  actions.
- `assets/test/routes/products/detail.route.test.tsx` covers the combined
  detail loader and UI behavior for loaded, empty, unavailable, and paginated
  offers alongside missing-product and unavailable-detail cases.
- The backend already exposes `merchantProducts(input:)` with `merchant`, `latestPrice`, and `priceHistory` fields in `lib/product_compare_web/schema.ex`.
- `test/product_compare_web/graphql/pricing_queries_test.exs` continues to cover the reused pricing GraphQL surface, so this completed slice stayed frontend-only.
- The detail route does not issue a second product-detail GraphQL request for
  offers: the combined query supplies the connection, while the panel derives
  safe visible rows and local fallback presentation.

## Historical Completion

- Rebaselined the next frontend slice into `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`.
- Task 1 complete: `/products/:slug` now loads active merchant offers from the existing GraphQL pricing surface and renders the success state with focused route coverage.
- Task 2 complete: the route now distinguishes offer-ready, offer-empty, and offer-unavailable states locally and verification covers the focused route test, pricing GraphQL test, frontend typecheck, and frontend unit suite.

## Closure

- The historical offer baseline is complete; the Product Offer Panel Data
  Contract is complete and no longer present in the live queue.
- Current queue membership is intentionally not duplicated here; dispatch
  starts at `docs/work/index.md` so completed lane evidence cannot become a
  stale second queue.
- `docs/plans/INDEX.md` and `ARCHITECTURE.md` are present; no fallback planning
  blocker applies.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-offers.md`
- `sed -n '1,220p' assets/src/routes/products/loader.ts`
- `sed -n '1,320p' assets/src/routes/products/ProductDetailRoute.tsx`
- `sed -n '1,420p' assets/src/routes/products/ProductOfferPanel.tsx`
- `sed -n '1,180p' assets/src/routes/products/ProductOfferList.tsx`
- `sed -n '1,260p' assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- `sed -n '1,260p' assets/test/routes/products/detail.route.test.tsx`
- `rg -n "merchantProducts|latestPrice|priceHistory" assets/src/routes/products/queries/ProductDetailRouteQuery.ts assets/test/routes/products/detail.route.test.tsx`
- `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
