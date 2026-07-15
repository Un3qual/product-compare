# Frontend Saved Comparison Navigation Work Doc

## Snapshot

- Status: done (saved comparison navigation data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after focused and full frontend verification (43
  focused tests; 74 files and 1,019 tests in the full gate).

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
  - Review-fix RED: the direct pure suite failed when a repeated cursor still
    produced a next-page href.
  - Review-fix GREEN: the combined pure and route-state suite passed 42 tests
    after requiring an advancing, non-empty next cursor; absent cursor coverage
    now includes `undefined` as well as `null` and `""`.
  - Final-review RED: temporarily removing the `hasNextPage` guard made the
    direct pure suite fail when a non-empty advancing cursor was present but no
    next page existed.
  - Final-review GREEN: after restoring the guard, the combined pure and
    route-state suite passed 43 tests, including the no-next-page cursor case.
- Verified commands:
  - `cd assets && bun x vitest run
    test/routes/compare/saved-comparisons-route-data.test.ts
    test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - `cd assets && bun run check`
  - direct framework import scan of
    `assets/src/routes/compare/saved-comparisons-route-data.ts`
  - `git diff --check`
- Exit condition met after the final-review GREEN verification: reopening
  preserves stored product order and current `URLSearchParams` encoding;
  pagination hides for unauthorized data, exposes first-page return only after
  a cursor, hides unavailable and non-advancing next cursors, suppresses
  non-empty cursors when `hasNextPage` is false, and encodes advancing cursors.
- The full frontend gate passed Relay validation, TypeScript, 74 test files and
  1,019 tests, client and SSR production builds, and the client bundle budget
  (181,915 gzip bytes against 200,000).
- Task re-review approved the contract after the advancement invariant and
  optional-cursor coverage fixes, with no remaining actionable issue.
- Final review found the existing `hasNextPage` guard lacked an independent
  direct case. Temporarily removing it made the new final-page test fail; after
  restoring production unchanged, 12 pure and 31 route-state tests passed.
- Final whole-batch re-review found no remaining saved-navigation behavior,
  ownership, framework-purity, test, or documentation issue.
