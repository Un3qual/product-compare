# CJ Import Task Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-23-cj-import-task-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the final CJ import contract and lane gate.

## Target Outcome

`Mix.Tasks.ProductCompare.Ingestion.CjImport` remains the stable manual,
worker, and resume entry point while option normalization, durable single-run
imports, and reviewed-candidate batching live in focused internal modules with
unchanged CLI behavior, public results, durable run state, candidate policy,
reports, errors, and credential safety.

## Ready Evidence

- `lib/mix/tasks/product_compare.ingestion.cj_import.ex` is 627 lines and
  combines three concrete implementation responsibilities behind the stable
  `run/1` and `run_import/1` boundary.
- The Oban product-import worker and `CjRuns` resume task depend only on
  `CjImport.run_import/1`, so the public task boundary can remain stable.
- The dedicated characterization suite passed 19 tests on 2026-07-23.
- The row is path-disjoint from Catalog, Comparison Snapshots, and Taxonomy
  context decomposition.
- This structural row does not reopen deferred provider, dashboard, operator,
  application-submission, or product-policy work.

## Internal Slices

1. CLI/default/fetch-option normalization and credential readiness.
2. Source resolution, durable run lifecycle, bounded page import, and reports.
3. Reviewed-candidate selection, deterministic batching, and aggregate results.
4. Stable facade, worker/resume caller boundary, and output parity.

## Boundaries

- Preserve `run/1`, `run_import/1`, accepted inputs, returns, raised errors, and
  printed output.
- Preserve run queries and finalization, cursor and page behavior,
  complete-scope reconciliation, counts, partial failures, and exception
  redaction.
- Preserve candidate filters, ordering, limits, skips, and explicit missing
  feed failures.
- Preserve secret-safe credential preflight and readiness enforcement.
- Do not change provider requests, ingestion persistence, schemas, migrations,
  scheduling, dashboard/operator scope, or product policy.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_import_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Final Contract And Lane Gate (2026-07-23)

- Ownership is complete: the stable `CjImport` facade owns CLI execution and
  presentation plus the public `run/1` / `run_import/1` boundary; `Options`
  owns CLI parsing, normalization, and readiness; `Runner` owns durable imports
  and reports; and `Candidates` owns reviewed-candidate batching.
- Exact source sizes: facade 108 lines; `Options` 152 lines; `Runner` 213
  lines; `Candidates` 198 lines (671 lines total across the four modules).
- Characterization: `mix test
  test/mix/tasks/product_compare_ingestion_cj_import_test.exs` passed with
  exactly 19 tests and 0 failures.
- Full gates passed: `mix typecheck`; `mix format --check-formatted`; `mix
  work_queue.validate` (3 ready rows; rerun with the permitted local PubSub
  socket escalation after the sandbox denied the socket); `mix ci`; and `git
  diff --check`.
- Boundary scan: `CJProductImportWorker` invokes only
  `CjImport.run_import/1`; `CjRuns` uses only `&CjImport.run_import/1` as its
  default resume runner. No external caller references `CjImport.Options`,
  `CjImport.Runner`, or `CjImport.Candidates`; those names occur only within
  the facade and the focused implementation modules themselves.
