# Frontend Saved Comparison Navigation Work Doc

## Snapshot

- Status: done (saved comparison navigation data contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 on `codex/route-policy-data-contracts`.

## Saved Comparison Navigation Data Contract

- Status: done on 2026-07-14.
- Completed action: extracted ordered saved-set reopen paths and first/next
  cursor pagination paths into a framework-free module. The route retains Relay
  query retention, deletion mutation and local state, router links, boundaries,
  and presentation.
- Owned paths:
  - `assets/src/routes/compare/saved-comparisons-route-data.ts`
  - `assets/src/routes/compare/SavedComparisonsRoute.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-data.test.ts`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `docs/work/frontend-saved-comparison-navigation.md`
- TDD evidence:
  - RED: `cd assets && bun x vitest run
    test/routes/compare/saved-comparisons-route-data.test.ts` failed as
    expected because `saved-comparisons-route-data` did not exist.
  - GREEN: the pure navigation suite passed 9 tests and the unchanged route
    state suite passed 31 tests. The combined command passed 40 tests.
- Verified commands:
  - `cd assets && bun x vitest run
    test/routes/compare/saved-comparisons-route-data.test.ts
    test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - direct framework import scan of
    `assets/src/routes/compare/saved-comparisons-route-data.ts`
  - `git diff --check`
- Exit condition met: reopening preserves stored product order and current
  `URLSearchParams` encoding; pagination hides for unauthorized data, exposes
  first-page return only after a cursor, hides unavailable next cursors, and
  encodes advancing cursors.
