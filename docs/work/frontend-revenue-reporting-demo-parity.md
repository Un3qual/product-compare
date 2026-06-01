# Frontend Revenue Reporting Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: not yet implemented
- Implementation plan: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
- Objective: make the existing public-safe `revenueSummary` GraphQL contract demoable from the browser UI without adding REST endpoints.

## Batch Status

- [ ] Task 1: add the Relay route query and loader for `/commerce/revenue`.
- [ ] Task 2: render the revenue reporting route.
- [ ] Task 3: wire navigation and close the lane.

## Current Batch

- Task: Task 1, add the Relay route query and loader for `/commerce/revenue`.
- Status: ready.
- Owned paths:
  - `assets/schema.graphql`
  - `assets/src/routes/commerce/revenue/**`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
  - `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
  - `docs/plans/NOW.md`
- Immediate prerequisite: the backend already exposes read-only `revenueSummary(input: RevenueSummaryInput)` with server-enforced low-volume suppression in `ProductCompareWeb.Resolvers.CommerceAttributionResolver`; Task 1 should refresh the local frontend schema snapshot, add the Relay route query, and preload the summary from route search params.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`, `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, and the current local `assets/schema.graphql` snapshot.

## Blockers

- None for Task 1.
