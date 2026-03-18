# Frontend Product Offers Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `ca3197b` + working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`
- Definition of done:
  - The Bun frontend renders an `Active offers` section on `/products/:slug` from the existing GraphQL pricing surface.
  - The detail route preserves product-level ready/not-found/unavailable behavior while distinguishing offers ready, empty, and unavailable states locally.
  - Route-level tests cover offer success, empty, and unavailable states without widening the route beyond the current pricing baseline.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Verified Current State

- `assets/src/routes/products/api.ts` now returns route-local `ready`, `not_found`, and `error` states for product detail loading by slug.
- `assets/src/routes/products/detail.tsx` now renders the product success state plus route-local fallback copy for missing and unavailable products.
- `assets/src/routes/products/__tests__/detail.route.test.tsx` now covers success, missing-product, and unavailable detail states.
- The backend already exposes `merchantProducts(input:)` with `merchant`, `latestPrice`, and `priceHistory` fields in `lib/product_compare_web/schema.ex`.
- `test/product_compare_web/graphql/pricing_queries_test.exs` already covers `merchantProducts` filtering plus latest-price/price-history behavior, so the next slice can stay frontend-only.
- The detail route does not yet fetch or render any merchant offers under `/products/:slug`.
- The older fullstack frontend plan remains too broad to execute directly; the next slice needs a narrow rebaseline from the current codebase.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`.

## Next Batch

1. Execute Task 1 from `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md` to load and render active merchant offers on `/products/:slug`.
2. Keep the slice narrow: success-state offers first, then offer fallback states and slice verification.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-offers.md`
- `sed -n '1,260p' docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`
- `sed -n '1,260p' assets/src/routes/products/api.ts`
- `sed -n '1,220p' assets/src/routes/products/detail.tsx`
- `rg -n "merchantProducts|latestPrice|priceHistory" lib/product_compare_web/schema.ex test/product_compare_web/graphql/pricing_queries_test.exs`
