# Frontend API Token Status Badge Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 84 passing
  API-token route-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API Token Status Badge Data Contract

- Status: ready on 2026-07-17.
- Next action: project the lifecycle-consistent badge tone alongside the
  existing status label in the framework-free API-token route-data owner.
- Candidate evidence: `buildApiTokenDisplayData` already owns status labels,
  while `ApiTokenItem` independently derives the matching tone; the focused
  suites pass 84 tests.
- Blockers: none.

## Boundaries

- Preserve active, revoked, and expired labels and revocation precedence.
- Use a positive tone only for active tokens and a neutral tone otherwise.
- Keep timestamps, actions, mutations, StatusBadge markup, and presentation in
  React.
- Keep the route-data owner transitively free of React, router, Relay, StyleX,
  Radix, and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the API-
  token route-data module
- `git diff --check`
