# CJ Runs Task Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-23-cj-runs-task-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the final CJ runs contract and lane gate.

## Batch Outcome

`Mix.Tasks.ProductCompare.Ingestion.CjRuns` remains the stable operator entry
point while option normalization, run reporting, and resume orchestration live
in focused internal modules with unchanged CLI behavior, public results,
queries, readiness checks, reports, errors, cursor behavior, and credential
safety.

## Completion Evidence

- Ownership is complete: the stable `CjRuns` facade owns Mix startup, public
  CLI dispatch, and the public `run/1`, `run_report/1`, and `run_resume/1`
  boundaries; `Options` owns parsing and normalization; `Reports` owns run
  queries, readiness, candidate counts, redaction, and rendering; and `Resume`
  owns latest-success selection, cursor reconstruction, runner execution, and
  safe output.
- Exact source sizes: facade 33 lines; `Options` 111 lines; `Reports` 223
  lines; `Resume` 281 lines (648 lines total across the four modules).
- The characterization command `mix test
  test/mix/tasks/product_compare_ingestion_cj_runs_test.exs` passed with
  exactly 10 tests and 0 failures on 2026-07-23.
- The weekly operator runbook invokes the stable
  `mix product_compare.ingestion.cj_runs` task for all CJ run reports and
  recovery checks. Application callers access only the stable facade; no
  external caller references `CjRuns.Options`, `CjRuns.Reports`, or
  `CjRuns.Resume`. `Resume` retains `&CjImport.run_import/1` as its default
  import runner, while the product-import worker separately retains its stable
  `CjImport.run_import/1` boundary.
- This structural extraction did not change provider requests, persistence,
  schemas, migrations, scheduling, runbook policy, dashboard/operator scope,
  or product policy.

## Delivered Ownership

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

- `mix test test/mix/tasks/product_compare_ingestion_cj_runs_test.exs` passed:
  10 tests, 0 failures.
- `mix typecheck` passed.
- `mix format --check-formatted` passed.
- `mix work_queue.validate` passed with 3 ready rows after the permitted local
  PubSub socket escalation (the sandbox denied the socket).
- `mix ci` passed: strict Reach found no issues, Dialyzer passed, the complete
  test suite passed 909 tests with 0 failures, and the frontend build/bundle
  contract passed.
- `git diff --check` passed.
