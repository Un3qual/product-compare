# CJ Read-Model And Operator Batch Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the retained CJ read-model and weekly operator-runbook batch into live `ready` queue rows without implementing any read model in this coordinator pass.

**Architecture:** This is a coordinator/docs workflow change. The promotion updates the live dispatcher, the Product data scraping lane doc, and the plan catalog so retained plans become an explicitly requested parallel batch of independent ready rows. Later workers must stay inside their row-owned paths.

**Tech Stack:** Markdown dispatch docs, Product Compare work queue conventions, Elixir/Mix verification commands referenced by worker rows.

**Status:** planned coordinator/docs workflow.

---

## Owned Paths

This plan intentionally owns coordinator docs because the requested deliverable is queue promotion:

- Create: `docs/plans/2026-07-01-cj-read-model-operator-batch-promotion-implementation-plan.md`
- Modify: `docs/work/index.md`
- Modify: `docs/work/product-data-scraping.md`
- Modify: `docs/plans/INDEX.md`

Do not modify `lib/**`, `test/**`, `assets/**`, `docs/runbooks/**`, or any retained read-model plan while executing this promotion.

## Constraints

- Promote exactly the retained CJ read-model and weekly operator-runbook batch.
- Do not promote persistent compare tray work in the same pass.
- Preserve `docs/work/index.md` as the only live dispatch queue.
- Keep `docs/plans/INDEX.md` as a catalog, not a second queue.
- Workers may edit only their row's target paths plus the named evidence heading in `docs/work/product-data-scraping.md`.
- Do not add scheduler behavior, GraphQL fields, browser routes, network calls, mutations, credential persistence, application submission, account-manager automation, Tier-3 scraping, or CSV export paths.
- Do not expose raw source-artifact payloads, artifact URLs, import queries, raw metadata, credentials, account ids, tracking params, provider error payloads, or secret values.
- Keep CJ candidate CSV score export rejected.

## Intended Parallel Dispatch

Use one `### Parallel Batch: CJ Read-Model And Weekly Operator Runbook` section under `## Ready Work` in `docs/work/index.md`. Include batch rules that tell workers to start from `docs/work/index.md`, `docs/work/operating-model.md`, `docs/work/product-data-scraping.md`, and their active plan.

Rows to promote:

| Row | Active plan | Owned code/doc paths | Verification |
| --- | --- | --- | --- |
| CJ Candidate Cohort Read Model | `docs/plans/2026-06-27-cj-candidate-cohort-read-model-implementation-plan.md` or refreshed `docs/plans/2026-07-01-cj-candidate-cohort-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_cohort.ex`, `test/product_compare/ingestion/cj_candidate_cohort_test.exs`, `docs/work/product-data-scraping.md` under `### Candidate Cohort Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_cohort_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Candidate Market Coverage Read Model | `docs/plans/2026-06-27-cj-candidate-market-coverage-read-model-implementation-plan.md` or refreshed `docs/plans/2026-07-01-cj-candidate-market-coverage-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_market_coverage.ex`, `test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`, `docs/work/product-data-scraping.md` under `### Candidate Market Coverage Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_market_coverage_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Candidate Freshness Read Model | `docs/plans/2026-06-27-cj-candidate-freshness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_candidate_freshness.ex`, `test/product_compare/ingestion/cj_candidate_freshness_test.exs`, `docs/work/product-data-scraping.md` under `### Candidate Freshness Evidence` only | `mix test test/product_compare/ingestion/cj_candidate_freshness_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Run Health Read Model | `docs/plans/2026-06-27-cj-run-health-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_health.ex`, `test/product_compare/ingestion/cj_run_health_test.exs`, `docs/work/product-data-scraping.md` under `### Run Health Evidence` only | `mix test test/product_compare/ingestion/cj_run_health_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Run Throughput Read Model | `docs/plans/2026-06-27-cj-run-throughput-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_run_throughput.ex`, `test/product_compare/ingestion/cj_run_throughput_test.exs`, `docs/work/product-data-scraping.md` under `### Run Throughput Evidence` only | `mix test test/product_compare/ingestion/cj_run_throughput_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Import Artifact Quality Read Model | `docs/plans/2026-06-27-cj-import-artifact-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_artifact_quality.ex`, `test/product_compare/ingestion/cj_import_artifact_quality_test.exs`, `docs/work/product-data-scraping.md` under `### Import Artifact Quality Evidence` only | `mix test test/product_compare/ingestion/cj_import_artifact_quality_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Import Price Quality Read Model | `docs/plans/2026-06-27-cj-import-price-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_import_price_quality.ex`, `test/product_compare/ingestion/cj_import_price_quality_test.exs`, `docs/work/product-data-scraping.md` under `### Import Price Quality Evidence` only | `mix test test/product_compare/ingestion/cj_import_price_quality_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Merchant Identity Quality Read Model | `docs/plans/2026-06-27-cj-merchant-identity-quality-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_merchant_identity_quality.ex`, `test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`, `docs/work/product-data-scraping.md` under `### Merchant Identity Quality Evidence` only | `mix test test/product_compare/ingestion/cj_merchant_identity_quality_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Application Readiness Read Model | `docs/plans/2026-06-27-cj-application-readiness-read-model-implementation-plan.md` | `lib/product_compare/ingestion/cj_application_readiness.ex`, `test/product_compare/ingestion/cj_application_readiness_test.exs`, `docs/work/product-data-scraping.md` under `### Application Readiness Evidence` only | `mix test test/product_compare/ingestion/cj_application_readiness_test.exs`, `mix format --check-formatted`, `mix typecheck`, `git diff --check` |
| CJ Weekly Operator Runbook | `docs/plans/2026-06-27-cj-weekly-operator-runbook-implementation-plan.md` | `docs/runbooks/cj-weekly-operator-loop.md`, `docs/work/product-data-scraping.md` under `### Weekly Operator Runbook Evidence` only | `rg -n "T[O]DO|T[B]D|CJ candidate CSV score export is all[ow]ed|CJ_(API_T[O]KEN|ACCOUNT_ID)=[^[:space:]]+" docs/runbooks/cj-weekly-operator-loop.md` exits 1, `git diff --check` |

## Lane Doc Update

Update `docs/work/product-data-scraping.md` so the lane no longer says the batch is retained behind product-facing work:

- Snapshot `Status`: `live ready parallel batch`.
- Snapshot `Live queue row`: `promoted on 2026-07-01 as the CJ read-model and weekly operator-runbook parallel batch`.
- Current Batch `Status`: `ready`.
- Current Batch `Decision`: `Promote the CJ-only read-model/runbook candidate pool now that the usable-product and product filtering/in-depth comparison queues have moved.`
- Keep all ten plan links.
- Keep every evidence heading.
- Keep all guardrails unchanged.
- Keep the next decision unchanged.
- Keep CJ candidate CSV score export rejected.

## Plan Catalog Update

Update `docs/plans/INDEX.md` as a catalog sync:

- Change `Active implementation plans:` from `None.` to the ten CJ read-model/runbook plans.
- Remove or reword the retained CJ candidate row while this batch is live.
- Leave eBay Browse fallback blocked.
- Leave rejected CJ candidate CSV score export rejected.

## Tasks

- [ ] Verify the live queue still has no ready rows and still names retained CJ as a coordinator option.

```bash
rg -n "No ready rows|retained CJ read-model|weekly operator-runbook|docs/plans/INDEX.md" docs/work/index.md
```

- [ ] Update `docs/work/index.md` with the parallel batch and ten rows above.
- [ ] Update `docs/work/product-data-scraping.md` to mark the retained batch live while preserving evidence headings.
- [ ] Update `docs/plans/INDEX.md` so the ten plans are listed as active catalog entries.
- [ ] Run docs verification:

```bash
rg -n "^Status: ready$" docs/work/index.md
rg -n "CJ Read-Model|CJ read-model|weekly operator" docs/work/index.md docs/work/product-data-scraping.md docs/plans/INDEX.md
rg -n "CJ candidate CSV score export is (allowed|promoted)|CJ_(API_TOKEN|ACCOUNT_ID)=[^[:space:]]+" docs/work/index.md docs/work/product-data-scraping.md docs/plans/INDEX.md
git diff --check
```

Expected:

- The first command shows the ten ready rows.
- The second command shows the batch is live in dispatcher, lane doc, and catalog.
- The third command exits 1 with no matches.
- `git diff --check` exits 0.

## Commit Guidance

```bash
git add docs/plans/2026-07-01-cj-read-model-operator-batch-promotion-implementation-plan.md docs/work/index.md docs/work/product-data-scraping.md docs/plans/INDEX.md
git commit -m "docs: promote cj read-model operator batch"
```

A docs-only commit is appropriate because the workflow system itself is the deliverable.

## Exit Condition

This promotion is complete when `docs/work/index.md` contains the ten CJ ready rows as one explicit parallel batch, `docs/work/product-data-scraping.md` says the batch is live and keeps all ten evidence headings, `docs/plans/INDEX.md` lists the ten plans as active catalog entries, no implementation files changed, docs verification passes, and a docs-only coordinator commit records the promotion.
