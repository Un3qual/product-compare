# Frontend Feed-Candidate Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 36 passing feed-candidate review-data and route
  tests, green TypeScript and dependency checks, and the full 771-backend /
  1,329-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Feed-Candidate Pagination Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the existing framework-free feed-candidate review-data owner now
  returns exact first-page and next-page hrefs while
  `FeedCandidateReviewList` retains empty-list behavior, shared markup, labels,
  and presentation.
- Candidate evidence: source inspection found this deterministic projection in
  the React list; before implementation, the existing pure and route suites
  passed 30 tests. Its owned paths did not overlap the verify-email, API-token,
  or affiliate-setup candidates.
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

## Completion Evidence

- RED: the pure review-data suite failed six new pagination cases because
  `buildFeedCandidatePaginationData` did not exist.
- Focused GREEN: the pure review-data and unchanged route suites passed 36
  tests.
- TypeScript completed with no errors, and the review-data owner has no React,
  React Router, Relay, generated GraphQL, or StyleX dependency.
- `git diff --check` passed.
- `mix ci` passed 771 backend and 1,329 frontend tests. Client production build
  validation passed at 596,289 raw / 182,138 gzip bytes for the initial
  JavaScript bundle.
