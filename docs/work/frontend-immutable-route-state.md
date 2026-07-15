# Frontend Immutable Route State

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 45 passing API-
  token plus 31 passing saved-comparison route-state tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Immutable Route-State Collection Contract

- Status: ready on 2026-07-15.
- Next action: consolidate the duplicated copy-on-write set helpers and the API-
  token route's map helpers into one framework-free route-state module while
  retaining each route's state transitions, Relay orchestration, errors,
  feedback, and presentation.
- Candidate evidence: both routes embed identical set add/remove behavior; the
  API-token route also owns matching map upsert/remove behavior. The focused
  route suites passed 76 tests.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/immutable-collection-state.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- framework-import scan of the pure state module
- `git diff --check`
