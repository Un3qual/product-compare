# Frontend Feed-Candidate Review View-Data Work Doc

## Snapshot

- Status: completed (feed-candidate review view-data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 with 7 pure view-data tests, 17 feed-candidate
  route tests, TypeScript, framework-boundary and secret/raw-field scans, and
  `git diff --check`.

## Feed-Candidate Review View-Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Delivered: deterministic candidate scoring, reasons, labels, status
  counts/tone, reviewed time, and filter-preserving pagination paths now live
  in a framework-free owner; Relay, mutations, draft notes, callbacks, and
  presentation remain in their existing React owners.
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
- Candidate evidence: `feed-candidate-review-data.ts` owns the deterministic
  policy. The focused Vitest run passed 24 tests across the 7 pure contract and
  17 route tests; `bun run typecheck`, framework-boundary and secret/raw-field
  scans, and `git diff --check` also passed with no findings.
- Blockers: none.
