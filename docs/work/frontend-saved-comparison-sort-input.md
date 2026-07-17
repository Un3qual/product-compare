# Frontend Saved-Comparison Sort Input

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 48 passing
  saved-comparison view-state and route-state tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved-Comparison Sort Input Contract

- Status: ready on 2026-07-17.
- Next action: move raw select-value normalization into the existing
  framework-free saved-comparison view-state owner.
- Candidate evidence: supported sort-value recognition and the safe current-
  order fallback remain embedded in `SavedComparisonSetList`; the focused
  suites pass 48 tests.
- Blockers: none.

## Boundaries

- Preserve all four sort modes and the current-order fallback.
- Keep filtering, sorting, local state, select events, options, markup, and
  presentation unchanged.
- Keep the view-state owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/saved-comparisons-view-state.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the saved view-state module
- `git diff --check`
