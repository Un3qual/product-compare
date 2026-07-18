# Frontend API Token Lifecycle Action Policy Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 88 passing API-
  token route-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API Token Lifecycle Action Policy Data Contract

- Status: ready on 2026-07-17.
- Next action: project lifecycle action availability, disabled state, and
  button copy from token status and row-scoped mutation state in the existing
  framework-free API-token route-data owner.
- Candidate evidence: `ApiTokenItem` currently derives shared pending state,
  hides actions for revoked tokens, checks active state separately for rotate,
  and chooses rotate/revoke button copy inline. The focused suites pass 88
  tests.
- Blockers: none.

## Boundaries

- Preserve no lifecycle actions for revoked tokens.
- Preserve revoke-only actions for expired, unrevoked tokens.
- Preserve rotate and revoke actions for active tokens.
- Preserve row-scoped mutual exclusion while rotate or revoke is pending and
  exact pending button copy.
- Keep variables, one-time-token handling, refs, expiry-preset interaction,
  forms, accessibility labels, mutation orchestration, errors, markup, and
  presentation in React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the API-
  token route-data module
- `git diff --check`
