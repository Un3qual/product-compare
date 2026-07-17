# Frontend Comparison Snapshot Pagination Cursor Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 31 passing
  share-comparison data and snapshot route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Comparison Snapshot Pagination Cursor Data Contract

- Status: ready on 2026-07-17.
- Next action: move next-page cursor eligibility into the existing framework-
  free share-comparison data owner.
- Candidate evidence: `ShareComparisonControl` currently reads raw Relay page
  info while the data owner already owns snapshot page merging and state
  policy; the focused suites pass 31 tests.
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
