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

Updated: 2026-06-29

The coordinator selected the CJ read-model and weekly operator-runbook candidate
pool as the next ten-batch Product data scraping slice. These rows are
independent except for their lane-doc evidence notes; parallel workers may edit
only their row's target paths and the named evidence heading in
`docs/work/product-data-scraping.md`.

## Ready Work

| Rank | Status | Lane | Next action | Plan | Target Paths | Verification | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ready | Product data scraping | Add CJ candidate cohort read model. | `docs/plans/2026-06-27-cj-candidate-cohort-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_cohort.ex`; `test/product_compare/ingestion/cj_candidate_cohort_test.exs`; `docs/work/product-data-scraping.md` under `### Candidate Cohort Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Safe CJ-only cohort counts and top-shortlist ordering are tested with no Mix task, GraphQL field, or browser surface. |
| 2 | ready | Product data scraping | Add CJ candidate market coverage read model. | `docs/plans/2026-06-27-cj-candidate-market-coverage-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`; `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`; `docs/work/product-data-scraping.md` under `### Candidate Market Coverage Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Market coverage buckets are tested from persisted candidate rows with no operator command or UI. |
| 3 | ready | Product data scraping | Add CJ candidate freshness read model. | `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_freshness.ex`; `test/product_compare/ingestion/cj_candidate_freshness_test.exs`; `docs/work/product-data-scraping.md` under `### Candidate Freshness Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Deterministic aggregate freshness buckets are tested without adding another CLI report. |
| 4 | ready | Product data scraping | Add CJ run health read model. | `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_health.ex`; `test/product_compare/ingestion/cj_run_health_test.exs`; `docs/work/product-data-scraping.md` under `### Run Health Evidence` only | `mix test test/product_compare/ingestion/cj_run_health_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Latest CJ run health is reported safely and deterministically from persisted runs. |
| 5 | ready | Product data scraping | Add CJ run throughput read model. | `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_throughput.ex`; `test/product_compare/ingestion/cj_run_throughput_test.exs`; `docs/work/product-data-scraping.md` under `### Run Throughput Evidence` only | `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Daily CJ run-throughput aggregates are tested and remain read-only. |
| 6 | ready | Product data scraping | Add CJ import artifact quality read model. | `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_artifact_quality.ex`; `test/product_compare/ingestion/cj_import_artifact_quality_test.exs`; `docs/work/product-data-scraping.md` under `### Import Artifact Quality Evidence` only | `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Safe aggregate quality metrics exist for persisted CJ import artifacts and external products. |
| 7 | ready | Product data scraping | Add CJ import price quality read model. | `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_price_quality.ex`; `test/product_compare/ingestion/cj_import_price_quality_test.exs`; `docs/work/product-data-scraping.md` under `### Import Price Quality Evidence` only | `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Tested price-coverage metrics exist for CJ-linked imported offers without adding UI or commands. |
| 8 | ready | Product data scraping | Add CJ merchant identity quality read model. | `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_merchant_identity_quality.ex`; `test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`; `docs/work/product-data-scraping.md` under `### Merchant Identity Quality Evidence` only | `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Identity quality metrics are tested and safe for later operator display. |
| 9 | ready | Product data scraping | Add CJ application readiness read model. | `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_application_readiness.ex`; `test/product_compare/ingestion/cj_application_readiness_test.exs`; `docs/work/product-data-scraping.md` under `### Application Readiness Evidence` only | `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`; `mix format --check-formatted`; `mix typecheck`; `git diff --check` | Manual application readiness is computed safely without application actions or exports. |
| 10 | ready | Product data scraping | Add CJ weekly operator loop runbook. | `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md` | `docs/runbooks/cj-weekly-operator-loop.md`; `docs/work/product-data-scraping.md` under `### Weekly Operator Runbook Evidence` only | `rg -n "T[O]DO|T[B]D|CJ candidate CSV score export is all[ow]ed|CJ_API_TOKEN=[^[:space:]]+|CJ_ACCOUNT_ID=[^[:space:]]+" docs/runbooks/cj-weekly-operator-loop.md` exits 1 with no matches; `git diff --check` | The runbook documents exact existing commands and hard guardrails without adding code or reopening rejected work. |

## Just Completed

The 2026-06-27 cross-project parallel batch completed these ten work items:

- Frontend catalog browse: `/products` page-size controls.
- Frontend product detail: `/products/:slug` active-offer pagination.
- Frontend offer discovery: visible `/offers` filters.
- Frontend merchant discovery: `/merchants` page-size controls.
- Frontend revenue reporting: deterministic date preset links.
- Frontend saved comparisons: client-side saved-set filtering.
- Frontend product comparison: compare-selection remove controls.
- Frontend API token management: create/rotate expiration presets.
- Frontend affiliate setup: selected merchant context summaries.
- Product data scraping: provider-neutral source-health read model.

## Deferred Work

Application submission, account-manager contact, Tier-3 scraping, credential
persistence, and CSV export remain out of scope. CJ candidate CSV score export
is rejected and should not be promoted. eBay Browse fallback remains blocked on
CJ catalog-scope evidence.

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
