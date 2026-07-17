# Frontend Alert Watch-Toggle Control Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 19 passing alert view-data and route tests,
  TypeScript, dependency scans, and `git diff --check`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alert Watch-Toggle Control Data Contract

- Status: completed on 2026-07-17.
- Completed: `priceWatchToggleControl` now projects immutable next enabled
  state plus Pause/Resume copy in the framework-free alerts view-data owner;
  React consumes the projection while retaining mutation orchestration,
  grouping, pending state, markup, and presentation.
- Evidence: the pure enabled, disabled, and input-immutability cases were
  RED (3 failures because the projection was missing), then GREEN alongside
  the route suite (19 passing tests).
- Blockers: none.

## Boundaries

- Enabled watches project a disabled mutation value and Pause label.
- Disabled watches project an enabled mutation value and Resume label.
- Keep generated types, mutation orchestration, grouping, pending state,
  markup, and presentation in React.
- Keep the view-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the alerts view-data
  module
- `git diff --check`
