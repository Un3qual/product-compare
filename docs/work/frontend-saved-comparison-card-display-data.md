# Frontend Saved Comparison Card Display Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 54 passing
  saved-comparison view-state and route-state tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved Comparison Card Display Data Contract

- Status: ready on 2026-07-17.
- Next action: move product-count and ordered product-name copy into the
  existing framework-free saved view-state owner.
- Candidate evidence: `SavedComparisonSetList` currently derives singular and
  plural product-count copy and joins ordered product names while the saved
  view-state owner already owns deterministic saved-set presentation policy;
  the focused suites pass 54 tests.
- Blockers: none.

## Boundaries

- Use the singular product label only for exactly one product and the plural
  label for every other count.
- Preserve product-name source order and duplicate names.
- Keep links, delete actions, markup, and presentation in React.
- Keep the view-state owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/saved-comparisons-view-state.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- consumer and framework/transport dependency scans of the saved view-state
  module
- `git diff --check`
