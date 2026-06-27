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

Updated: 2026-06-27

| Rank | Status | Lane | Next Action | Active Plan | Target Paths | Verification | Exit Condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Product data scraping | Add an operator command that resumes CJ product imports from the latest successful product-import cursor. | `docs/plans/2026-06-27-cj-product-import-resume-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_import_resume.ex`; `test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_import_resume_test.exs`; `mix typecheck`; `git diff --check` | Resume command is tested, secret-safe, and lane evidence records completion or blocker. |
| 2 | ready | Product data scraping | Add an operator command that resumes CJ feed discovery from the latest successful discovery cursor. | `docs/plans/2026-06-27-cj-feed-discovery-resume-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_feeds_resume.ex`; `test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_feeds_resume_test.exs`; `mix typecheck`; `git diff --check` | Resume command is tested, secret-safe, and lane evidence records completion or blocker. |
| 3 | ready | Product data scraping | Add a read-only CJ product import history command for recent `shoppingProducts` runs. | `docs/plans/2026-06-27-cj-product-import-history-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_import_history.ex`; `test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_import_history_test.exs`; `mix typecheck`; `git diff --check` | History command is tested, scheduler-safe, secret-safe, and lane evidence records completion or blocker. |
| 4 | ready | Product data scraping | Add a read-only CJ feed discovery history command for recent `shoppingProductFeeds` runs. | `docs/plans/2026-06-27-cj-feed-discovery-history-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_discovery_history.ex`; `test/mix/tasks/product_compare_ingestion_cj_discovery_history_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_discovery_history_test.exs`; `mix typecheck`; `git diff --check` | History command is tested, scheduler-safe, secret-safe, and lane evidence records completion or blocker. |
| 5 | ready | Product data scraping | Add a read-only CJ feed candidate staleness report. | `docs/plans/2026-06-27-cj-feed-candidate-staleness-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_candidate_staleness.ex`; `test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_staleness_test.exs`; `mix typecheck`; `git diff --check` | Staleness report is tested, read-only, secret-safe, and lane evidence records completion or blocker. |
| 6 | ready | Product data scraping | Add a dry-run-first CJ feed candidate batch review command for explicit candidate ids. | `docs/plans/2026-06-27-cj-feed-candidate-batch-review-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_candidate_review_batch.ex`; `test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_review_batch_test.exs`; `mix typecheck`; `git diff --check` | Batch review command is tested, bounded, dry-run-first, and lane evidence records completion or blocker. |
| 7 | ready | Product data scraping | Add a read-only Markdown report for shortlisted CJ application cohort review. | `docs/plans/2026-06-27-cj-application-cohort-markdown-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_application_cohort_markdown.ex`; `test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_application_cohort_markdown_test.exs`; `mix typecheck`; `git diff --check` | Markdown report is tested, non-secret, not a CSV export, and lane evidence records completion or blocker. |
| 8 | ready | Product data scraping | Add a read-only CJ ingestion readiness gate combining credential presence, run freshness, and candidate counts. | `docs/plans/2026-06-27-cj-ingestion-readiness-gate-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`; `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`; `mix typecheck`; `git diff --check` | Readiness gate is tested, scheduler-safe, secret-safe, and lane evidence records completion or blocker. |
| 9 | ready | Product data scraping | Add a read-only failed-run report across CJ product import and feed discovery surfaces. | `docs/plans/2026-06-27-cj-failed-run-report-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_failed_runs.ex`; `test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_failed_runs_test.exs`; `mix typecheck`; `git diff --check` | Failed-run report is tested, scheduler-safe, secret-safe, and lane evidence records completion or blocker. |
| 10 | ready | Product data scraping | Add a read-only CJ feed candidate fit-gap report for pending candidate triage. | `docs/plans/2026-06-27-cj-feed-candidate-fit-gap-report-task-implementation-plan.md` | `lib/mix/tasks/product_compare.ingestion.cj_candidate_fit_gaps.ex`; `test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/mix/tasks/product_compare_ingestion_cj_candidate_fit_gaps_test.exs`; `mix typecheck`; `git diff --check` | Fit-gap report is tested, read-only, does not persist scores or export CSV, and lane evidence records completion or blocker. |

## Ready Work

The Product data scraping lane has a ten-plan CJ operator loop batch ready for
parallel execution. Each row owns a distinct Mix task/test pair plus its own
evidence heading in `docs/work/product-data-scraping.md`.

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
