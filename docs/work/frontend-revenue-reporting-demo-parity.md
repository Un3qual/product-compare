# Frontend Revenue Reporting Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 2 frontend route render verification
- Implementation plan: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
- Objective: make the existing public-safe `revenueSummary` GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/commerce/revenue`.
- [x] Task 2: render the revenue reporting route.
- [ ] Task 3: wire navigation and close the lane.

## Current Batch

- Task: Task 3, wire navigation and close the lane.
- Status: ready.
- Owned paths:
  - `assets/src/routes/commerce/revenue/**`
  - `assets/src/router.tsx`
  - `assets/src/routes/root.tsx`
  - `assets/src/routes/__tests__/root.route.test.tsx`
  - `assets/src/__tests__/router.test.tsx`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
  - `docs/work/index.md`
  - `docs/plans/NOW.md`
- Immediate prerequisite: Task 2 added `RevenueSummaryRoute` with a GET filter form, loader-filter echoing, Relay-preloaded metric rendering, public-safe suppression copy, and loader/query error fallback. Task 3 should register `/commerce/revenue`, expose it from navigation, run focused frontend verification, verify the existing backend revenue summary contract, and close the lane.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`, `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, and the current local `assets/schema.graphql` snapshot.
- Task 1 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` failed because `../loader` did not exist.
- Task 1 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 2 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx` failed because `../index` did not exist.
- Task 2 implementation verification passed with `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` and `cd assets && bun run typecheck`.

## Blockers

- None for Task 2.
