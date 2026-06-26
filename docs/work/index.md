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
| 1 | ready | Product data scraping | Implement the CJ provider credential readiness parallel batch: standalone status task, product-import preflight, and feed-discovery preflight. Do not add credential persistence, live provider calls, UI, scheduling, merchant outreach, or CSV export. | `docs/plans/2026-06-26-cj-provider-credential-status-task-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-import-credential-preflight-implementation-plan.md`<br>`docs/plans/2026-06-26-cj-feed-discovery-credential-preflight-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_credentials.ex`; `test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs`; `.env.example`; `lib/mix/tasks/product_compare.ingestion.cj_import.ex`; `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`; `lib/mix/tasks/product_compare.ingestion.cj_feeds.ex`; `test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_credentials_test.exs test/mix/tasks/product_compare_ingestion_cj_import_test.exs test/mix/tasks/product_compare_ingestion_cj_feeds_test.exs`; `mix typecheck`; `git diff --check` | All three credential readiness slices pass focused tests, typecheck, and diff check; lane doc records per-slice evidence and either promotes the next ingestion decision or returns to no ready work. |

## Ready Work

The Product data scraping row is ready. It is a parallel provider credential
readiness batch with three non-overlapping implementation plans.

## Deferred Work

Application automation, account-manager automation, product import scheduling,
and Tier-3 scraping remain out of scope until explicitly promoted. CJ candidate
CSV score export is rejected and should not be promoted.

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
