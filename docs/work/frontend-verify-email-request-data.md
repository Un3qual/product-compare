# Frontend Verify-Email Request Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 14 passing
  recovery-route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Verify-Email Request Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate token normalization, missing-token state and error
  identity, mutation variables, exact success and status copy, and failed-
  outcome retry eligibility in a framework-free data owner while retaining the
  promise cache, single-use request deduplication, Relay orchestration,
  cancellation lifecycle, hooks, state, markup, and presentation in
  `VerifyEmailRoute`.
- Candidate evidence: current source inspection found those deterministic
  policies embedded in the React route; its recovery-route suite passes 14
  tests and its owned paths do not overlap the three comparison candidates.
- Blockers: none.

## Boundaries

- Preserve the generated verify-email mutation contract and existing auth
  outcome/error owners.
- Preserve successful in-flight and settled request reuse plus failed-outcome
  eviction so a later mount can retry.
- Leave the request cache, Relay commit and promise orchestration, commit ref,
  effect cancellation, hooks, state, markup, and presentation in React.
- The pure owner may only answer whether an action result remains cacheable.

## Verification

- `cd assets && bun x vitest run test/routes/auth/verify-email-data.test.ts test/routes/auth/recovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure verify-email data module
- `git diff --check`
