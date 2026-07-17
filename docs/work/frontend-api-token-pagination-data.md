# Frontend API-Token Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 75 passing
  API-token route-data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## API Token Pagination Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate first-page and next-page link visibility and path
  projection in the existing framework-free API-token route-data owner while
  retaining shared pagination markup, labels, and presentation in
  `ApiTokenPagination`.
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
