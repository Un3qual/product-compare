# Frontend Merchant Discovery Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, Task 1 loader/query implementation
- Implementation plan: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Objective: make the existing public merchant discovery GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/merchants`.
- [ ] Task 2: render the merchant discovery route.
- [ ] Task 3: wire navigation and close the lane.

## Current Batch

- Task: Task 2, render the merchant discovery route.
- Status: ready.
- Owned paths:
  - `assets/src/routes/merchants/**`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Immediate prerequisite: Task 1 added `MerchantDirectoryRouteQuery`, `merchantDirectoryLoader`, generated `MerchantDirectoryRouteQuery.graphql.ts`, and refreshed the local schema snapshot with `Query.merchants(first:, after:)`, `MerchantConnection`, and `MerchantEdge`. Task 2 should consume `merchantDirectoryLoader` data and render ready, empty, pagination, and loader-error states without wiring navigation yet.

## Verification

- Plan creation verified the existing backend contract by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/pricing_resolver.ex`, and the local `assets/schema.graphql` merchant types.
- Task 1 restored missing frontend dependencies with `cd assets && bun install`, then verified RED with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts` failing because `../loader` did not exist.
- Task 1 found the local schema snapshot was also missing `MerchantConnection` and `MerchantEdge`; after adding those types plus `Query.merchants(first:, after:)`, `cd assets && bun run relay` passed and generated `assets/src/__generated__/MerchantDirectoryRouteQuery.graphql.ts`.
- Task 1 GREEN verification passed with `cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts` and `cd assets && bun run typecheck`.

## Blockers

- None for Task 2.
