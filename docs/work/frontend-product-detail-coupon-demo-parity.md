# Frontend Product Detail Coupon Demo Parity

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, final demo-slice verification
- Implementation plan: `docs/plans/2026-06-01-frontend-product-detail-coupon-demo-parity-implementation-plan.md`
- Objective: render active, shopper-facing coupons on the Relay-backed product detail route without changing authenticated affiliate management flows.

## Batch Status

- [x] Task 1: add public display coupons to product offers GraphQL.
- [x] Task 2: render active coupons on product detail offers.
- [x] Task 3: run demo-slice verification and close the lane.

## Current Batch

- Task: none.
- Status: completed.
- Owned paths:
  - `lib/product_compare_web/schema.ex`
  - `lib/product_compare_web/resolvers/affiliate_resolver.ex`
  - `test/product_compare_web/graphql/pricing_queries_test.exs`
  - `assets/src/routes/products/**`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-product-detail-coupon-demo-parity.md`
  - `docs/work/index.md`
  - `docs/plans/2026-06-01-frontend-product-detail-coupon-demo-parity-implementation-plan.md`
  - `docs/plans/NOW.md`
  - `docs/plans/INDEX.md`
  - `ARCHITECTURE.md`
- Next step: no unblocked product-detail coupon demo parity batch remains; product ingestion remains blocked pending live CJ credentials, representative payloads, quota behavior, and source onboarding compliance signoff.

## Verification

- Plan creation verified the gap by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `docs/plans/2026-03-05-frontend-fullstack-design.md`, `assets/src/routes/products/detail.tsx`, `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/affiliate_resolver.ex`, `test/product_compare_web/graphql/affiliate_workflows_test.exs`, and `test/product_compare_web/graphql/pricing_queries_test.exs`.
- At plan creation, product detail rendered active merchant offers and latest price, but not active coupons.
- The existing top-level `activeCoupons(input:)` query remains authenticated; this lane's backend batch is limited to a public display-scoped nested field for product-detail offer rendering.
- Task 1 verified RED with `mix test test/product_compare_web/graphql/pricing_queries_test.exs` failing because `MerchantProduct.activeCoupons` did not exist.
- Task 1 added `MerchantProduct.activeCoupons(first:, after:, at:)` with display-scoped `ActiveCoupon` connection types, leaving top-level `activeCoupons(input:)` authentication unchanged.
- Task 1 GREEN verification passed with `mix test test/product_compare_web/graphql/pricing_queries_test.exs`.
- Task 1 immediate adjacent verification passed with `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`.
- Task 2 verified RED with `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` failing because the product offer row omitted active coupon codes/details and the empty coupon message.
- Task 2 refreshed `assets/schema.graphql`, extended `ProductOffersRouteQuery` with `MerchantProduct.activeCoupons(first: 2)`, generated `ProductOffersRouteQuery.graphql.ts`, and rendered coupon code, description, formatted discount text, terms, and empty coupon rows under each active offer.
- Task 2 GREEN verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, and `cd assets && bun run typecheck`.
- Task 3 focused verification passed with `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, and `cd assets && bun run typecheck`.
- Task 3 broader verification passed with `cd assets && bun run check` and `git diff --check`.

## Blockers

- None.
