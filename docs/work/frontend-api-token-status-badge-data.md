# Frontend API Token Status Badge Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 87 passing API-token route-data and route
  tests, TypeScript, dependency-closure, consumer-usage, and whitespace checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API Token Status Badge Data Contract

- Status: completed on 2026-07-17.
- Delivered: `buildApiTokenDisplayData` now projects the lifecycle-consistent
  `statusTone` alongside `statusLabel`; active is `positive`, while revoked
  and expired are `neutral`.
- React consumer: `ApiTokenItem` passes the projected tone to `StatusBadge`.
- Blockers: none.

## Boundaries

- Preserve active, revoked, and expired labels and revocation precedence.
- Use a positive tone only for active tokens and a neutral tone otherwise.
- Keep timestamps, actions, mutations, StatusBadge markup, and presentation in
  React.
- Keep the route-data owner transitively free of React, router, Relay, StyleX,
  Radix, and generated-query dependencies.

## Verification

- `cd assets && bun run test test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx` — 87 passed.
- `cd assets && bun run typecheck` — passed.
- Recursive relative-import closure of the API-token route-data module — four
  files, no external framework or transport imports.
- Consumer-usage scan confirms `ApiTokenItem` passes `displayData.statusTone`
  to `StatusBadge`.
- `git diff --check` — passed.
