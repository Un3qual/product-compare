# Frontend Saved Comparison Card Display Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after Task 67 moved deterministic card display
  copy into the framework-free saved view-state owner; 55 saved-comparison
  view-state and route-state tests pass, as does `cd assets && bun run typecheck`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved Comparison Card Display Data Contract

- Status: completed on 2026-07-17.
- Delivered: the saved view-state owner now projects immutable card display
  data: singular/plural/zero product-count copy and ordered product-name copy
  that preserves duplicates.
- Evidence: focused suites pass 55 tests; TypeScript, the saved-view-state
  consumer scan, the framework/transport dependency scan, and `git diff --check`
  pass.
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
