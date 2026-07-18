# Frontend Comparison Snapshot Pagination Cursor Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 39 passing share-comparison data and snapshot
  route tests, TypeScript, dependency, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Comparison Snapshot Pagination Cursor Data Contract

- Status: completed on 2026-07-17.
- Completed action: moved next-page cursor eligibility into the existing
  framework-free share-comparison data owner. `ShareComparisonControl` retains
  Relay variables, page accumulation, actions, markup, and presentation.
- TDD evidence: RED command `cd assets && bun x vitest run
  test/routes/compare/share-comparison-data.test.ts` failed as expected with
  8 new cases because `nextComparisonSnapshotCursor` was not a function (25
  passing, 8 failing). GREEN command `cd assets && bun x vitest run
  test/routes/compare/share-comparison-data.test.ts
  test/routes/compare/comparison-snapshots.test.tsx` passed 39 tests.
- Contract evidence: a next page produces only a non-empty advancing cursor;
  missing connections, incomplete page info, false next-page flags, blank or
  whitespace-only cursors, and repeated cursors produce no next-page action.
- Verification: `cd assets && bun run typecheck` passed; the direct
  framework/transport dependency scan of `share-comparison-data.ts` returned
  no matches; and `git diff --check` passed.
- Blockers: none.

## Boundaries

- Return a non-empty cursor only when Relay reports a next page.
- Return no cursor for missing connections, incomplete page info, false next-
  page flags, and blank cursors.
- Keep Relay variables, page accumulation, actions, markup, and presentation in
  the React owner.
- Keep the data owner free of React, router, Relay, StyleX, Radix, and generated-
  query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the share-comparison data module
- `git diff --check`
