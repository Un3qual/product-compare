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
| 1 | ready | Product data scraping | Implement the six-plan CJ ingestion readiness batch: credential status, import credential preflight, feed-discovery credential preflight, application cohort report, product import status, and disabled-by-default product import scheduler. Do not add credential persistence, live provider calls in tests, UI, merchant outreach, application submission, or CSV export. | `docs/plans/2026-06-26-cj-provider-credential-status-task-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-import-credential-preflight-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-feed-discovery-credential-preflight-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-application-cohort-report-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-product-import-status-task-implementation-plan.md`<br>`docs/plans/2026-06-26-scheduled-cj-product-import-runtime-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`; `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`; `.env.example`; `lib/mix/tasks/product_compare.ingestion.cj_import.ex`; `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`; `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`; `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`; `lib/mix/tasks/product_compare.ingestion.cj_application_cohort.ex`; `test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs`; `lib/mix/tasks/product_compare.ingestion.cj_import_status.ex`; `test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs`; `lib/product_compare/ingestion/cj_product_import_scheduler.ex`; `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`; `lib/product_compare/application.ex`; `config/runtime.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs test/mix/tasks/product_compare_ingestion_cj_application_cohort_test.exs test/mix/tasks/product_compare_ingestion_cj_import_status_test.exs test/product_compare/ingestion/cj_product_import_scheduler_test.exs test/product_compare/ingestion/cj_feed_discovery_scheduler_test.exs`; `mix typecheck`; `git diff --check` | All six slices pass focused tests, adjacent scheduler tests, typecheck, and diff check; lane doc records per-slice evidence and the lane returns to a coordinator decision or no ready work. |

## Ready Work

The Product data scraping row is ready. It is a six-plan parallel CJ ingestion
readiness batch with mostly non-overlapping implementation plans.

## Deferred Work

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted.

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
