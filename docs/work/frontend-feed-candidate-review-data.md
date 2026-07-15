# Frontend Feed-Candidate Review View-Data Work Doc

## Snapshot

- Status: ready (feed-candidate review view-data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 17 passing
  feed-candidate route tests.

## Feed-Candidate Review View-Data Contract

- Status: ready on 2026-07-15.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: isolate deterministic candidate scoring, reasons, labels,
  status counts/tone, reviewed time, and filter-preserving pagination paths in
  a framework-free owner while preserving Relay, mutations, draft notes,
  callbacks, and presentation.
- Owned paths:
  - `assets/src/routes/ingestion/feed-candidates/feed-candidate-review-data.ts`
  - `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
  - `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
  - `assets/test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts`
  - `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  - `docs/work/frontend-feed-candidate-review-data.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidate-review-data.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  - `cd assets && bun run typecheck`
  - framework-import and secret/raw-field scans
  - `git diff --check`
- Exit condition: one framework-free owner preserves the current fit score and
  reasons, candidate/status/count/time labels, current-page status counts, and
  filtered first/next paths without mutating input; React and Relay owners
  retain all orchestration, controls, state, markup, and styling.
- Candidate evidence: current source inspection found this deterministic policy
  embedded in the 409-line `FeedCandidateReviewList`; its route suite passed 17
  tests.
- Blockers: none.
