# Frontend Alert Watch-Toggle Control Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 16 passing
  alert view-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alert Watch-Toggle Control Data Contract

- Status: ready on 2026-07-17.
- Next action: move enabled-state inversion and Pause/Resume copy into the
  existing framework-free alerts view-data owner.
- Candidate evidence: `AlertsRoute` currently duplicates the next enabled
  mutation value and toggle label while the alerts view-data owner already
  owns deterministic watch presentation policy; the focused suites pass 16
  tests.
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
