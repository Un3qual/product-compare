# CJ Runs Task Decomposition

## Snapshot

- Status: ready
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-23-cj-runs-task-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the dedicated CJ runs Mix-task suite.

## Target Outcome

`Mix.Tasks.ProductCompare.Ingestion.CjRuns` remains the stable operator entry
point while option normalization, run reporting, and resume orchestration live
in focused internal modules with unchanged CLI behavior, public results,
queries, readiness checks, reports, errors, cursor behavior, and credential
safety.

## Ready Evidence

- `lib/mix/tasks/product_compare.ingestion.cj_runs.ex` is 600 lines and
  combines three concrete implementation responsibilities behind stable
  `run/1`, `run_report/1`, and `run_resume/1` boundaries.
- The weekly operator runbook invokes only the Mix task, and resume execution
  depends only on the stable `CjImport.run_import/1` entry point.
- The dedicated characterization suite passed 10 tests on 2026-07-23.
- The row is path-disjoint from Comparison Snapshots, Taxonomy, and CJ Import
  decomposition.
- This structural row does not reopen provider, persistence, scheduling,
  dashboard, operator-product, or product-policy work.

## Internal Slices

1. CLI/default/report/surface normalization and bounds.
2. Latest, history, and failed-run queries plus operator-safe rendering.
3. Cursor reconstruction, import/discovery resume, safe runner execution, and
   output.
4. Stable Mix-task facade, runbook boundary, and caller parity.

## Boundaries

- Preserve `run/1`, `run_report/1`, and `run_resume/1`, accepted inputs,
  returns, raised errors, and printed output.
- Preserve report defaults, aliases, limits, ordering, readiness, counts,
  freshness, and error redaction.
- Preserve cursor requirements, reconstructed runner options, callback
  injection, exception handling, and secret-safe logs.
- Do not change provider requests, persistence, schemas, migrations,
  scheduling, runbook policy, deferred operator scope, or product policy.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
