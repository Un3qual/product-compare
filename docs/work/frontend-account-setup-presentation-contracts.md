# Frontend Account And Setup Presentation Contracts

## Snapshot

- Status: complete
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-20-account-setup-interaction-contracts-implementation-plan.md`
- Last verified: 2026-07-20 from the implemented affiliate and API-token
  policy owners, focused behavior suites, and the full frontend gate.

## Batch Outcome

Authenticated setup and account surfaces obtain deterministic merchant-context
copy and API-token lifecycle action policy from their existing framework-free
owners without changing forms, mutations, accessibility, or presentation.

## Internal Slices

1. Affiliate selected/current merchant-context copy.
2. API-token lifecycle action visibility, disabled state, and pending copy.

These slices use path-disjoint milestone commits but share one reviewer gate and
one queue status. They must not be promoted as separate replacement rows.

## Boundaries

- Preserve all current normal-path copy and action behavior.
- Preserve row-scoped API-token mutual exclusion.
- Keep form refs, Relay mutations, callbacks, markup, and styling in React.
- Keep pure owners transitively free of framework and transport dependencies.

## Verification

- RED: affiliate data test failed because
  `getAffiliateMerchantContext` was absent.
- GREEN: affiliate setup data and route suites passed (52 tests).
- RED: five API-token lifecycle cases failed because
  `buildApiTokenActionPolicy` was absent.
- GREEN: API-token route-data and route suites passed (96 tests).
- `cd assets && bun run check` passed (104 files, 1499 tests, Relay,
  TypeScript, client/SSR builds, and 182,154-byte gzip initial bundle).
- Pure-module dependency scans passed: both route-data owners depend only on
  framework-free local helpers.
- `mix work_queue.validate` passed with 7 ready rows.
- `git diff --check` passed.
