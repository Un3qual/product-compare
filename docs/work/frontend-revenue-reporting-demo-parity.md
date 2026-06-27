# Frontend Revenue Reporting Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 3 route registration, navigation, and lane closure verification
- Implementation plan: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
- Current implementation plan: `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md`
- Objective: make the existing public-safe `revenueSummary` GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/commerce/revenue`.
- [x] Task 2: render the revenue reporting route.
- [x] Task 3: wire navigation and close the lane.

## Current Cross-Project Batch

- Status: ready.
- Plan: `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/commerce/revenue/index.tsx`
  - `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/commerce/revenue` has deterministic date presets that preserve network and currency filters.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`, `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, and the current local `assets/schema.graphql` snapshot.
- Task 1 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` failed because `../loader` did not exist.
- Task 1 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 2 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx` failed because `../index` did not exist.
- Task 2 implementation verification passed with `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` and `cd assets && bun run typecheck`.
- Task 3 RED verification:
  - `cd assets && bun x vitest run src/__tests__/router.test.tsx` failed because `commerce/revenue` was not registered.
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` failed because the `Revenue` links were not present.
  - After code review, `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` failed because the home actions did not yet have an accessible `Home actions` group.
- Task 3 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`, `cd assets && bun run typecheck`, and `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`.

## Blockers

- None.
