# Frontend Merchant-Directory Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 39 passing merchant-directory loader and route
  tests, green TypeScript and dependency checks, and the full 771-backend /
  1,335-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Merchant Directory Pagination Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the existing framework-free merchant-directory pagination owner now
  returns exact first-page and next-page hrefs while `MerchantDirectoryView`
  retains shared markup, labels, and presentation.
- Candidate evidence: current source inspection found this deterministic
  projection in the React route; the existing loader and route suites pass 33
  tests and its owned paths do not overlap the API-token, affiliate-setup, or
  feed-candidate candidates.
- Blockers: none.

## Boundaries

- Preserve `merchantDirectoryPagePath` as the canonical page-size-preserving
  and cursor-encoding path owner.
- Preserve first-page visibility only when Relay reports a previous page and a
  current cursor exists.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor exists.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the merchant-directory pagination
  module
- `git diff --check`

## Completion Evidence

- RED: the loader suite failed six new pagination cases because
  `buildMerchantDirectoryPaginationData` did not exist.
- Focused GREEN: the loader and unchanged route suites passed 39 tests.
- TypeScript completed with no errors, and the pagination owner has no React,
  React Router, Relay, generated GraphQL, or StyleX dependency.
- `git diff --check` passed.
- `mix ci` passed 771 backend and 1,335 frontend tests. Client and SSR
  production builds passed; the initial JavaScript bundle was 596,289 raw /
  182,142 gzip bytes.
