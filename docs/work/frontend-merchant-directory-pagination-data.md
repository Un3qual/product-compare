# Frontend Merchant-Directory Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 33 passing
  merchant-directory loader and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Merchant Directory Pagination Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate first-page and next-page link visibility and path
  projection in the existing framework-free merchant-directory pagination
  owner while retaining shared pagination markup, labels, and presentation in
  `MerchantDirectoryView`.
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
