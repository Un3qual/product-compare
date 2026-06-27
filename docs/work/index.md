# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- If no `ready` row exists, do not scan historical plans looking for work.
- `needs_decision` rows are coordinator work: make one decision, then promote exactly
  one concrete `ready` row or one explicitly requested parallel batch of independent
  ready rows, remove the decision row so the selected `blocked` row becomes
  highest-ranked, or leave the missing decision named.
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
| 1 | ready | Product data scraping | Add CJ candidate cohort read model. | `docs/plans/2026-06-27-cj-candidate-cohort-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_cohort.ex`; `test/product_compare/ingestion/cj_candidate_cohort_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`; `mix typecheck`; `git diff --check` | Safe CJ-only cohort counts and top-shortlist ordering are available without adding a Mix task or browser surface. |
| 2 | ready | Product data scraping | Add CJ candidate market coverage read model. | `docs/plans/2026-06-27-cj-candidate-market-coverage-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`; `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`; `mix typecheck`; `git diff --check` | Review-safe market coverage counts exist for CJ candidates. |
| 3 | ready | Product data scraping | Add CJ candidate freshness read model. | `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_freshness.ex`; `test/product_compare/ingestion/cj_candidate_freshness_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`; `mix typecheck`; `git diff --check` | Deterministic aggregate freshness buckets exist without adding another CLI report. |
| 4 | ready | Product data scraping | Add CJ run health read model. | `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_health.ex`; `test/product_compare/ingestion/cj_run_health_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_run_health_test.exs`; `mix typecheck`; `git diff --check` | Latest safe CJ run-health data is available from persisted runs. |
| 5 | ready | Product data scraping | Add CJ run throughput read model. | `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_throughput.ex`; `test/product_compare/ingestion/cj_run_throughput_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`; `mix typecheck`; `git diff --check` | Daily CJ run-throughput aggregates are tested and read-only. |
| 6 | ready | Product data scraping | Add CJ import artifact quality read model. | `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_artifact_quality.ex`; `test/product_compare/ingestion/cj_import_artifact_quality_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`; `mix typecheck`; `git diff --check` | Safe aggregate artifact/external-product quality metrics exist. |
| 7 | ready | Product data scraping | Add CJ import price quality read model. | `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_price_quality.ex`; `test/product_compare/ingestion/cj_import_price_quality_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`; `mix typecheck`; `git diff --check` | CJ-linked imported offer price coverage is available without UI or commands. |
| 8 | ready | Product data scraping | Add CJ merchant identity quality read model. | `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_merchant_identity_quality.ex`; `test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`; `mix typecheck`; `git diff --check` | Merchant identity quality metrics are tested and safe for later operator display. |
| 9 | ready | Product data scraping | Add CJ application readiness read model. | `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_application_readiness.ex`; `test/product_compare/ingestion/cj_application_readiness_test.exs`; `docs/work/product-data-scraping.md` | `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`; `mix typecheck`; `git diff --check` | Manual application readiness can be computed without performing application actions. |
| 10 | ready | Product data scraping | Add CJ weekly operator runbook. | `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md` | `docs/runbooks/cj-weekly-operator-loop.md`; `docs/work/product-data-scraping.md` | Placeholder/secret scan from active plan; `git diff --check` | Exact existing operator commands and hard guardrails are documented without new code. |

## Ready Work

Ten `ready` Product data scraping work-item rows exist. They are planned as one
parallel batch of read-model and runbook work; they are not Mix task
implementation plans.

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
