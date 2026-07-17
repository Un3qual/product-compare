# Frontend Feed-Candidate Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 30 passing
  feed-candidate review-data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Feed-Candidate Pagination Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate first-page and next-page link visibility and path
  projection in the existing framework-free feed-candidate review-data owner
  while retaining shared pagination markup, labels, and presentation in
  `FeedCandidateReviewList`.
- Candidate evidence: current source inspection found this deterministic
  projection in the React list; the existing pure and route suites pass 30
  tests and its owned paths do not overlap the verify-email, API-token, or
  affiliate-setup candidates.
- Blockers: none.

## Boundaries

- Preserve the existing first- and next-page builders as the canonical page-
  size-, review-status-, sort-, and cursor-encoding owners.
- Preserve first-page visibility only when Relay reports a previous page and a
  current cursor exists.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor exists.
- Preserve the current empty-list early return without rendering pagination.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the feed-candidate review-data module
- `git diff --check`
