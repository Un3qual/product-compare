# Frontend Catalog-Browse Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 69 passing catalog path and browse route
  tests, green TypeScript and dependency checks, and the full 771-backend /
  1,342-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Browse Pagination Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the framework-free catalog path owner now returns exact first-page
  and next-page hrefs while `BrowseRoute` retains empty-page recovery, shared
  pagination markup, labels, and presentation.
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

## Completion Evidence

- RED: the new path suite failed seven pagination cases because
  `buildCatalogBrowsePaginationData` did not exist.
- Focused GREEN: the pure path and unchanged browse route suites passed 69
  tests.
- TypeScript completed with no errors, and the catalog path owner has no React,
  React Router, Relay, generated GraphQL, or StyleX dependency.
- `git diff --check` passed.
- `mix ci` passed 771 backend and 1,342 frontend tests. Client and SSR
  production builds passed; the initial JavaScript bundle was 596,289 raw /
  182,144 gzip bytes.
