# Frontend Catalog-Browse Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 62 passing
  catalog browse route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Browse Pagination Data Contract

- Status: ready on 2026-07-17.
- Next action: isolate first-page and next-page link visibility and path
  projection in the existing framework-free catalog path owner while retaining
  shared pagination markup, labels, empty-page recovery behavior, and
  presentation in `BrowseRoute`.
- Candidate evidence: current source inspection found this deterministic
  projection in the React route; the existing browse route suite passes 62
  tests and its owned paths do not overlap the affiliate-setup, feed-candidate,
  or merchant-directory candidates.
- Blockers: none.

## Boundaries

- Preserve the canonical catalog first-page and next-page builders as the
  filter-, page-size-, cursor-, and ordered compare-slug-encoding owners.
- Preserve first-page visibility only when a current cursor exists.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor exists.
- Preserve pagination on empty result pages for stale-cursor recovery.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/catalog/paths.test.ts test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the catalog path module
- `git diff --check`
