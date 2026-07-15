# Frontend Feed-Candidate Review Mutation Data

## Snapshot

- Status: active
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and 17 passing
  feed-candidate route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Feed-Candidate Review Mutation Data Contract

- Status: active on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Next action: isolate explicit-draft detection, trimmed review mutation-input
  construction, and immutable successful-draft removal in a framework-free
  data module while retaining React state, Relay mutation orchestration,
  errors, feedback, revalidation, and presentation in `FeedCandidatesRoute`.
- Candidate evidence: current source inspection found the deterministic input
  and draft-removal policy embedded in the React owner, and
  `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
  passed 17 tests.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- framework-import and secret/raw-field scans of the pure data module
- `git diff --check`
