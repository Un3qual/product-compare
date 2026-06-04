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

Updated: 2026-06-04

| Rank | Status | Lane | Work Doc | Next Action | Target Paths | Verification | Exit Condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Product data ingestion / frontend demo parity | `docs/work/product-data-scraping.md` | Add durable review status for CJ merchant feed candidates and route controls to mark candidates pending, shortlisted, or dismissed. | `docs/plans/2026-06-04-cj-feed-candidate-review-status-implementation-plan.md`, `docs/work/product-data-scraping.md`, `priv/repo/migrations/20260604230000_add_review_status_to_merchant_feed_candidates.exs`, `lib/product_compare_schemas/ingestion/merchant_feed_candidate.ex`, `lib/product_compare/ingestion.ex`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/ingestion_resolver.ex`, `test/product_compare/ingestion/ingestion_test.exs`, `test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`, `assets/schema.graphql`, `assets/src/routes/ingestion/feed-candidates/**`, `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`, `assets/src/__generated__/ReviewMerchantFeedCandidateMutation.graphql.ts` | `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare_web/graphql/merchant_feed_candidate_queries_test.exs`, `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/ingestion/feed-candidates/__tests__/feed-candidates-loader.test.ts src/routes/ingestion/feed-candidates/__tests__/feed-candidates.route.test.tsx`, `cd assets && bun run typecheck`, `mix typecheck`, `git diff --check` | Candidates keep review state across discovery replays; browser controls update status without exposing raw metadata or starting application automation. |

## Ready Work

Ready row 1 promotes the smallest actionable follow-up after the read-only CJ
feed candidate review route: durable status review. Application automation,
scheduled discovery, scoring algorithms, and Tier-3 scraping remain out of
scope.

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
