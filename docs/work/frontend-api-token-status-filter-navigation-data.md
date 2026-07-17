# Frontend API-Token Status-Filter Navigation Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 80 passing API-
  token route-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API-Token Status-Filter Navigation Data Contract

- Status: ready on 2026-07-17.
- Next action: move ordered status-filter labels, destinations, and current
  state into the existing API-token route-data owner.
- Candidate evidence: `ApiTokenControls` currently owns filter order, labels,
  current-state policy, and raw destinations while the route-data owner already
  owns the canonical status type and page paths; the focused suites pass 80
  tests.
- Blockers: none.

## Boundaries

- Preserve All, Active, and Revoked order and labels.
- Use canonical status-aware destinations and mark exactly one filter current.
- Keep link rendering, accessibility attributes, route behavior, markup, and
  presentation in React.
- Keep the route-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the route-data module
- `git diff --check`
