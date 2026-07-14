# Complete-Run Offer Reconciliation Implementation Plan

**Goal:** Deactivate offers missing from a proven complete import scope without
allowing bounded, partial, failed, or differently scoped runs to hide valid
offers.

**Design:**
`docs/superpowers/specs/2026-07-13-offer-truth-and-durable-ingestion-design.md`

**Owned paths:**

- `lib/product_compare/ingestion.ex`
- `lib/product_compare/ingestion/reconciliation.ex`
- `lib/product_compare/ingestion/cj_run_health.ex`
- `lib/product_compare/ingestion/jobs/arguments.ex`
- `lib/product_compare/ingestion/jobs/cj_product_import_worker.ex`
- `lib/product_compare/ingestion/jobs/health.ex`
- `lib/product_compare/ingestion/cj_product_import_scheduler.ex`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `lib/product_compare_schemas/ingestion/import_observation.ex`
- `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- `lib/product_compare/application.ex`
- `config/runtime.exs`
- `priv/repo/migrations/*_add_ingestion_reconciliation.exs`
- `test/product_compare/ingestion/reconciliation_test.exs`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `test/product_compare/ingestion/jobs/**`
- `test/product_compare/ingestion/cj_product_import_scheduler_test.exs`
- `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- `test/support/fixtures/cj_ingestion_fixtures.ex`
- `docs/work/product-trust-and-discovery.md`
- `docs/runbooks/cj-weekly-operator-loop.md`

## Safety Contract

- Reconciliation is opt-in through an explicit complete-scope flag.
- A run may reconcile only when it succeeds, has zero failed records, and
  reaches an end cursor of `nil`.
- Membership is run-scoped and compares only prior observations with the same
  source, provider, surface, and canonical query fingerprint.
- Partial, failed, bounded, or differently scoped runs never deactivate unseen
  offers.
- A fresh later observation can reactivate an offer through the existing
  merchant-product upsert.
- Operational reads expose only status, counts, and timestamps; query values
  and provider errors remain private.

## Tasks

1. Write failing context tests for same-scope deactivation, partial/failed
   safety, scope isolation, idempotent replay, and reactivation.
2. Add run reconciliation metadata and a run-observation relation that stores
   stable database IDs, not raw provider records.
3. Record each successfully persisted listing in its import run transaction and
   compute a deterministic scope fingerprint from canonical non-secret inputs.
4. Finalize complete runs transactionally, deactivate only historically
   observed unseen merchant products, and persist the safe outcome/count.
5. Add the explicit complete-scope option to the CJ task and durable product
   job while retaining a fail-closed default of `false`.
6. Extend safe run/job health with the latest reconciliation outcome and run
   focused ingestion, Mix-task, formatting, type, queue, and diff gates.

Specification-rich enrichment is the next ingestion milestone. It remains
outside this reconciliation slice.

## Completion Evidence

- Completed 2026-07-13 on `codex/product-trust-and-discovery`.
- Focused reconciliation/task/job/health suite: 31 tests, 0 failures.
- Ingestion and affected CJ task suite: 177 tests, 0 failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, and `git diff --check` passed.
