# Frontend Product Detail Price History Demo Parity

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, final demo-slice verification.
- Implementation plan: `docs/plans/2026-06-01-frontend-product-detail-price-history-demo-parity-implementation-plan.md`
- Objective: render a compact, accessible price-history baseline for active product-detail offers using the existing `MerchantProduct.priceHistory` GraphQL contract.

## Batch Status

- [x] Task 1: refresh the frontend price-history contract and render price-history rows.
- [x] Task 2: run demo-slice verification and close the lane.

## Current Batch

- Task: none.
- Status: completed.
- Owned paths:
  - `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
  - `assets/src/routes/products/detail.tsx`
  - `assets/src/routes/products/__tests__/detail.route.test.tsx`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-product-detail-price-history-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-product-detail-price-history-demo-parity-implementation-plan.md`
- Next step: no unblocked product-detail price-history demo parity batch remains.

## Verification

- Plan creation verified the remaining V1 gap by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `docs/plans/2026-03-05-frontend-fullstack-design.md`, `assets/src/routes/products/detail.tsx`, `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`, `assets/schema.graphql`, `lib/product_compare_web/schema.ex`, and `test/product_compare_web/graphql/pricing_queries_test.exs`.
- The V1 frontend design still calls for a product-detail price-history visualization baseline.
- Backend GraphQL already exposes `MerchantProduct.priceHistory(first:, after:, from:, to:)` and `PricePoint.observedAt`, with focused pricing GraphQL tests.
- Task 1 RED: `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` failed as expected with 2 failures because the route did not render the `Acme price history` list or `No price history for this offer yet.`.
- Task 1 GREEN: `bun run relay` completed, `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` passed 21 tests, and `bun run typecheck` completed with `tsc --noEmit`.
- Task 1 refreshed the frontend schema/query contract for `MerchantProduct.priceHistory(first:, after:, from:, to:)`, `PricePoint.observedAt`, `PricePointConnection`, and `PricePointEdge`, then rendered compact per-offer price-history rows with empty and has-more states.
- Task 1 review fix RED: `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` failed with 1 failure because free-shipping coupon text and valid-through text were absent.
- Task 1 review fix GREEN: `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` passed 21 tests and `bun run typecheck` completed with `tsc --noEmit`.
- Task 2 focused verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `cd assets && bun run typecheck`, and `mix test test/product_compare_web/graphql/pricing_queries_test.exs`.
- Task 2 broader verification passed with `cd assets && bun run check` and `git diff --check`.

## Blockers

- None.
