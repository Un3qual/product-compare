# Frontend Revenue Reporting Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 1 frontend loader verification
- Implementation plan: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
- Objective: make the existing public-safe `revenueSummary` GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/commerce/revenue`.
- [ ] Task 2: render the revenue reporting route.
- [ ] Task 3: wire navigation and close the lane.

## Current Batch

- Task: Task 2, render the revenue reporting route.
- Status: ready.
- Owned paths:
  - `assets/src/routes/commerce/revenue/**`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
  - `docs/plans/NOW.md`
- Immediate prerequisite: Task 1 refreshed the local frontend schema snapshot for `revenueSummary`, added `RevenueSummaryRouteQuery`, generated `RevenueSummaryRouteQuery.graphql.ts`, and added `revenueSummaryLoader` with normalized aggregate filters and recoverable preload error handling. Task 2 should render the preloaded route data and loader error state.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`, `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, and the current local `assets/schema.graphql` snapshot.
- Task 1 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` failed because `../loader` did not exist.
- Task 1 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts`, and `cd assets && bun run typecheck`.

## Blockers

- None for Task 2.
