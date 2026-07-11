# CJ Scheduled Readiness Implementation Plan

**Status:** ready

**Goal:** Distinguish manual CJ pilot freshness from recurring scheduled CJ
operation through the existing non-secret readiness gate.

**Architecture:** Extend the read-only readiness task with schedule booleans
derived from the same environment contract used by runtime configuration. Keep
manual readiness backward compatible, make scheduled readiness opt-in through
`--require-scheduled`, and retain `--require-ready` as the enforcement switch.

## Global Constraints

- Keep both CJ schedulers disabled by default.
- Never print credential, account, provider payload, or tracking values.
- Do not add live network calls to tests.
- Do not add eBay, dashboards, scraping, application automation, credential
  persistence, or CSV export.

## Owned Paths

- `lib/mix/tasks/product_compare.ingestion.cj_readiness_gate.ex`
- `test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`
- `docs/runbooks/cj-weekly-operator-loop.md`
- `docs/work/product-data-scraping.md`

## Batches

- [ ] Add RED coverage for manual compatibility, disabled/partial/enabled
  schedule state, truthy normalization, and combined enforcement.
- [ ] Add `--require-scheduled` plus non-secret schedule output to the existing
  readiness task.
- [ ] Document bounded scheduled activation and post-run verification in the
  operator runbook.
- [ ] Run focused tests, type and format checks, and diff checks; record lane
  evidence and commit the milestone.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_readiness_gate_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `git diff --check`

## Exit Condition

Operators can require evidence that both bounded schedules are enabled in
addition to the existing credential, freshness, and candidate gates, while
manual readiness remains backward compatible and secret-safe.

