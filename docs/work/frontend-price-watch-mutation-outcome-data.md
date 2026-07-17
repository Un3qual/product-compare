# Frontend Price-Watch Mutation Outcome Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 16 passing
  price-watch data and alerts-route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price-Watch Mutation Outcome Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate exact create-watch completion interpretation in the
  existing framework-free price-watch data module while retaining FormData,
  Relay mutation promises, product-keyed reset, rule state, pending state,
  feedback placement, markup, and styling in `PriceWatchControl`.
- Candidate evidence: current source inspection found structural completion
  and shared-error interpretation in the React owner; the existing pure owner
  already identifies amount-bearing rules and builds the create input, and its
  pure and alerts-route suites pass 16 tests.
- Blockers: none.

## Boundaries

- Reuse `routeMutationErrorMessage`; do not create a parallel error policy.
- Preserve current fact-first success behavior when a complete watch coexists
  with payload or top-level GraphQL errors.
- Preserve the exact create-watch success copy.
- Leave `FormData`, Relay promise orchestration, product-keyed reset, rule and
  pending state, feedback placement, markup, and presentation in
  `PriceWatchControl`.

## Verification

- `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure price-watch data module
- `git diff --check`
