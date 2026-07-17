# Frontend Compare Specification-Mode Navigation Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 109 passing
  compare route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Specification-Mode Navigation Data Contract

- Status: ready on 2026-07-17.
- Next action: move ordered mode labels, canonical destinations, and current
  state into a framework-free compare mode-data owner.
- Candidate evidence: `CompareRoute` currently owns the mode rows and derives
  current state and paths while the compare path owner already defines
  canonical slug and specification-mode URLs; the route suite passes 109
  tests.
- Blockers: none.

## Boundaries

- Preserve Shared specs, Differences, and All specs order and labels.
- Preserve selected-slug order, omit `specs` for shared mode, and mark exactly
  one mode current.
- Keep Radix tabs, links, panels, children, markup, and presentation in React.
- Keep the mode-data owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare-spec-mode-data.test.ts test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the mode-data module
- `git diff --check`
