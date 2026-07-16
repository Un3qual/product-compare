# Frontend Feed-Candidate Review Mutation Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 with 29 passing focused tests (12 pure contract
  tests and 17 feed-candidate route tests), a passing TypeScript check, clean
  module scans, and a path-scoped diff check.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Feed-Candidate Review Mutation Data Contract

- Status: completed on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Completed: extracted framework-free explicit-draft detection, trimmed review
  mutation-input construction, and immutable successful-draft removal into
  `feed-candidate-review-mutation-data.ts`. `FeedCandidatesRoute` retains
  React state, Relay mutation orchestration, errors, feedback, revalidation,
  and presentation.
- Verification: `cd assets && bun x vitest run
  test/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.test.ts
  test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx` passed
  29 tests (12 pure and 17 route). `cd assets && bun run typecheck` passed.
  Framework-import and secret/raw-field scans returned no matches; the
  path-scoped diff check passed.

## Verification

- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidate-review-mutation-data.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- framework-import and secret/raw-field scans of the pure data module
- `git diff --check`
