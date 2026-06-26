# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row, remove the decision row so the selected `blocked` row
  becomes highest-ranked, or leave the missing decision named.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Current Queue

Updated: 2026-06-26

Parallel CJ candidate planning batch is ready. These rows are intentionally
split by target paths so workers can run concurrently.

## Ready Work

### Row 1: CJ Feed Candidate Ranking Contract

Status: ready
Lane: Product data ingestion
Work doc: `docs/work/product-data-scraping.md`
Plan: `docs/plans/2026-06-26-cj-feed-candidate-ranking-contract-implementation-plan.md`
Next action: add backend review-status filtering and deterministic candidate
ranking args for `merchantFeedCandidates`.
Owned paths:
- `lib/product_compare/ingestion.ex`
- `lib/product_compare_web/resolvers/ingestion_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare/ingestion/ingestion_test.exs`
- `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `assets/schema.graphql`
- `docs/work/product-data-scraping.md` under the ranking-contract evidence
  heading only
Verification:
- `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`
- `cd assets && bun run relay`
- `mix typecheck`
- `git diff --check`
Exit condition: ranking/filtering query behavior is covered and no frontend
route or export-task files were edited.

### Row 2: CJ Feed Candidate Review Workspace

Status: ready
Lane: Product data ingestion
Work doc: `docs/work/product-data-scraping.md`
Plan: `docs/plans/2026-06-26-cj-feed-candidate-review-workspace-implementation-plan.md`
Next action: improve `/ingestion/feed-candidates` with current-page review
counts, note capture, and reviewed metadata using the existing GraphQL contract.
Owned paths:
- `assets/src/routes/ingestion/feed-candidates/index.tsx`
- `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `docs/work/product-data-scraping.md` under the review-workspace evidence
  heading only
Verification:
- `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: route test and typecheck pass without backend schema, Relay
schema, or generated-artifact edits.

### Row 3: CJ Shortlist Cohort Export

Status: ready
Lane: Product data ingestion
Work doc: `docs/work/product-data-scraping.md`
Plan: `docs/plans/2026-06-26-cj-shortlist-cohort-export-implementation-plan.md`
Next action: add a read-only Mix task that exports reviewed CJ feed candidates
as non-secret CSV for manual merchant application planning.
Owned paths:
- `lib/mix/tasks/product_compare.ingestion.cj_candidate_export.ex`
- `test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
- `docs/work/product-data-scraping.md` under the shortlist-export evidence
  heading only
Verification:
- `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_export_test.exs`
- `mix typecheck`
- `git diff --check`
Exit condition: export task emits only safe candidate fields and no browser,
GraphQL schema, or ingestion-context files were edited.

## Deferred Work

Scheduled CJ discovery, application automation, provider credential config,
account-manager automation, broad scoring algorithms, and Tier-3 scraping remain
out of scope until explicitly promoted after this parallel batch.

## Executor Prompts

Coordinator:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Process the highest-ranked non-ready row.
Make exactly one decision or unblock exactly one blocker.
Update only the live queue plus the directly affected lane or plan docs.
End with either one ready row or a clearly named blocker.
```

Worker:

```text
Start at docs/work/index.md.

Read docs/work/operating-model.md.
Execute only the highest-ranked row whose Status is ready.
Open only that row's Work Doc, linked active plan if any, Target Paths, and immediate tests.
Update the lane work doc as the batch changes.
Do not edit coordinator-owned docs unless the ready row names them as Target Paths.
Stop if the row is blocked, stale, or needs a decision.
```

## Completed Work

Completed lane summaries remain in their lane work docs under `docs/work/*.md`.
Dated implementation plans remain under `docs/plans/`. They are historical
reference unless this queue links one as the active plan for a `ready` row.
