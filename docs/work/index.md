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

| Rank | Status | Lane | Next Action | Active Plan | Target Paths | Verification | Exit Condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Product data scraping | Add disabled-by-default scheduled CJ feed discovery by extracting the manual feed-discovery runner and supervising a bounded runtime scheduler. | `docs/plans/2026-06-26-scheduled-cj-feed-discovery-runtime-implementation-plan.md` | `lib/product_compare/ingestion/cj_feed_discovery.ex`; `lib/product_compare/ingestion/cj_feed_discovery_scheduler.ex`; `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`; `lib/product_compare/application.ex`; `config/runtime.exs`; `test/product_compare/ingestion/cj_feed_discovery_test.exs`; `test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`; `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`; `docs/work/product-data-scraping.md` runtime evidence heading only | `mix test test/product_compare/ingestion/cj_feed_discovery_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`; `mix typecheck`; `git diff --check` | Scheduler is opt-in, bounded, secret-free in config/logs, and the manual `cj_feeds` task behavior remains verified. |
| 2 | ready | Product data scraping | Add a read-only CJ feed discovery status task for latest-run and freshness checks. | `docs/plans/2026-06-26-cj-feed-discovery-status-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_discovery_status.ex`; `test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`; `docs/work/product-data-scraping.md` discovery-status evidence heading only | `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_status_test.exs`; `mix typecheck`; `git diff --check` | Operator can check latest/fresh CJ feed discovery state without network calls, mutations, secrets, or raw metadata output. |
| 3 | ready | Product data scraping | Add `/ingestion/feed-candidates` review-status and sort controls over the existing backend query args. | `docs/plans/2026-06-26-cj-feed-candidate-filter-controls-implementation-plan.md` | `assets/src/routes/ingestion/feed-candidates/pagination.ts`; `assets/src/routes/ingestion/feed-candidates/loader.ts`; `assets/src/routes/ingestion/feed-candidates/queries/MerchantFeedCandidatesRouteQuery.ts`; `assets/src/routes/ingestion/feed-candidates/index.tsx`; `assets/src/__generated__/MerchantFeedCandidatesRouteQuery.graphql.ts`; `assets/test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts`; `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`; `docs/work/product-data-scraping.md` feed-candidate-controls evidence heading only | `cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates-loader.test.ts test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`; `cd assets && bun run relay`; `cd assets && bun run typecheck`; `git diff --check` | Candidate review route filters/sorts refreshed candidates and preserves selected filters across pagination. |

## Ready Work

The scheduled CJ discovery candidate is promoted as a three-row parallel batch:
runtime scheduling, operator freshness/status, and frontend candidate
filter/sort controls. The rows may run in parallel because their implementation
paths do not overlap except for lane-local evidence headings in
`docs/work/product-data-scraping.md`.

Application automation, provider credential config, account-manager automation,
broad scoring algorithms, product import scheduling, and Tier-3 scraping remain
out of scope until explicitly promoted.

## Deferred Work

Application automation, provider credential config, account-manager automation,
broad scoring algorithms, product import scheduling, and Tier-3 scraping remain
out of scope until explicitly promoted after this scheduled discovery batch.

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
