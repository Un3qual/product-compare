# Frontend Saved-Comparison Sort Input

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after the explicit RED regression, 55 passing
  saved-comparison tests, and the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved-Comparison Sort Input Contract

- Status: completed on 2026-07-17.
- Result: the framework-free saved-comparison view-state owner now normalizes
  raw select values to all four supported sort modes and falls back to current
  order for blank, unknown, and future values.
- Candidate evidence: before this batch, supported sort-value recognition and
  the safe current-order fallback were embedded in `SavedComparisonSetList`;
  the baseline focused suites passed 48 tests.
- Blockers: none.

## Boundaries

- Preserve all four sort modes and the current-order fallback.
- Keep filtering, sorting, local state, select events, options, markup, and
  presentation unchanged.
- Keep the view-state owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- RED: the seven normalization cases failed because the framework-free function
  did not exist.
- GREEN: `cd assets && bun x vitest run test/routes/compare/saved-comparisons-view-state.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
  passed 55 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, router, Relay,
  StyleX, Radix, or generated-query imports in the saved view-state module.
- `cd assets && bun run check` passed Relay validation, TypeScript, all 1,363
  frontend tests, client and SSR production builds, and the client-bundle
  contract at 596,339 raw / 182,138 gzip bytes.
- `git diff --check` passed.
