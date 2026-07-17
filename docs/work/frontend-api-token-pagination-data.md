# Frontend API-Token Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 80 passing API-token route-data and route
  tests, green TypeScript and dependency checks, and the full 771-backend /
  1,317-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API Token Pagination Data Contract

- Status: completed on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the existing framework-free API-token route-data owner now returns
  exact first-page and next-page hrefs while `ApiTokenPagination` retains
  shared markup, labels, and presentation.
- Candidate evidence: current source inspection found this deterministic
  projection in the React route; the existing pure route-data and route suites
  pass 75 tests and its owned paths do not overlap the comparison or verify-
  email candidates.
- Blockers: none.

## Boundaries

- Preserve `apiTokenPagePath` as the canonical status-preserving and cursor-
  encoding path owner.
- Preserve first-page visibility only for a non-empty current cursor.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/account/api-tokens/api-token-route-data.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `cd assets && bun run typecheck`
- framework dependency scan of the API-token route-data module
- `git diff --check`

## Completion Evidence

- RED: the pure route-data suite failed five new pagination cases because
  `buildApiTokenPaginationData` did not exist.
- Focused GREEN: the pure route-data and unchanged route suites passed 80 tests.
- TypeScript completed with no errors, and the route-data owner has no React,
  React Router, Relay, generated GraphQL, or StyleX dependencies.
- `git diff --check` passed.
- `mix ci` passed 771 backend and 1,317 frontend tests. Client production build
  validation passed at 596,289 raw / 182,136 gzip bytes for the initial
  JavaScript bundle.
