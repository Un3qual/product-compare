# Frontend Merchant Discovery Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01, plan creation against architecture and existing merchant GraphQL contract
- Implementation plan: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Objective: make the existing public merchant discovery GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [ ] Task 1: add the Relay route query and loader for `/merchants`.
- [ ] Task 2: render the merchant discovery route.
- [ ] Task 3: wire navigation and close the lane.

## Current Batch

- Task: Task 1, add the Relay route query and loader for `/merchants`.
- Status: ready.
- Owned paths:
  - `assets/src/routes/merchants/**`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-merchant-discovery-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
- Immediate prerequisite: `ARCHITECTURE.md` records merchant discovery as an existing GraphQL backend surface and the next non-ingestion demo-parity candidate after revenue reporting. `ProductCompareWeb.Schema` exposes public `merchants(first:, after:)`, `assets/schema.graphql` already includes `Merchant`, `MerchantConnection`, and `MerchantEdge`, and `PricingResolver.merchants/3` returns cursor-paginated merchants. Task 1 must add the missing `Query.merchants(first:, after:)` entry to the local schema snapshot before Relay generation.

## Verification

- Plan creation verified the existing backend contract by reading `ARCHITECTURE.md`, `docs/plans/INDEX.md`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/pricing_resolver.ex`, and the local `assets/schema.graphql` merchant types.

## Blockers

- None for Task 1.
