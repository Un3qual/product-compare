# Frontend Product Offers Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `a9f7a7f` + working tree
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

- `assets/src/routes/products/api.ts` preserves route-local `ready`, `not_found`, and `error` states for product detail loading while adding offer-local `ready`, `empty`, and `error` states after the product lookup succeeds.
- `assets/src/routes/products/detail.tsx` renders an `Active offers` section on `/products/:slug` for offer success, empty, and unavailable states without collapsing the product detail shell.
- `assets/src/routes/products/__tests__/detail.route.test.tsx` covers offer success, empty, and unavailable states alongside the existing missing-product and unavailable-detail cases.
- The backend already exposes `merchantProducts(input:)` with `merchant`, `latestPrice`, and `priceHistory` fields in `lib/product_compare_web/schema.ex`.
- `test/product_compare_web/graphql/pricing_queries_test.exs` continues to cover the reused pricing GraphQL surface, so this completed slice stayed frontend-only.
- The detail loader now issues a second GraphQL request for `merchantProducts(input:)` after the product lookup succeeds and normalizes offer link and latest-price text for rendering plus local offer fallback handling.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`.
- Task 1 complete: `/products/:slug` now loads active merchant offers from the existing GraphQL pricing surface and renders the success state with focused route coverage.
- Task 2 complete: the route now distinguishes offer-ready, offer-empty, and offer-unavailable states locally and verification covers the focused route test, pricing GraphQL test, frontend typecheck, and frontend unit suite.

## Closure

- This work item is complete.
- No next active frontend batch is queued yet under `docs/work/index.md`.
- The repo-level fallback for creating the next plan is currently blocked because `docs/plans/INDEX.md` and `ARCHITECTURE.md` are absent.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-offers.md`
- `sed -n '1,260p' docs/plans/2026-03-18-frontend-product-offers-baseline-implementation-plan.md`
- `sed -n '1,260p' assets/src/routes/products/api.ts`
- `sed -n '1,220p' assets/src/routes/products/detail.tsx`
- `sed -n '1,320p' assets/src/routes/products/__tests__/detail.route.test.tsx`
- `rg -n "merchantProducts|latestPrice|priceHistory" lib/product_compare_web/schema.ex test/product_compare_web/graphql/pricing_queries_test.exs`
- `mix test test/product_compare_web/graphql/pricing_queries_test.exs`
- `cd assets && bun run typecheck`
- `cd assets && bun run test:unit`
