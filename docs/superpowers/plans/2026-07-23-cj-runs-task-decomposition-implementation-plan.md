# CJ Runs Task Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `Mix.Tasks.ProductCompare.Ingestion.CjRuns` as the stable
operator entry point while moving option normalization, run reporting, and
resume orchestration into focused internal modules.

**Architecture:** The Mix task retains `run/1`, `run_report/1`, and
`run_resume/1` as the caller-facing boundary. `Options` owns CLI and keyword
normalization, `Reports` owns read queries and operator-safe report rendering,
and `Resume` owns cursor reconstruction, runner invocation, safe failure
logging, and resume output.

**Tech Stack:** Elixir, Mix, Ecto, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `run/1`, `run_report/1`, and `run_resume/1`, their accepted CLI and
  keyword inputs, return values, raised errors, and printed output.
- Preserve report defaults, surface aliases, bounds, ordering, readiness
  checks, candidate counts, failure counts, and error-summary redaction.
- Preserve latest-success selection, cursor requirements, reconstructed import
  and discovery options, callback injection, runner exception handling, and
  secret-safe log context.
- Keep the weekly operator runbook and `CjImport.run_import/1` caller boundary
  unchanged.
- Do not change CJ provider requests, ingestion persistence, schemas,
  migrations, scheduling, runbook policy, dashboard/operator scope, or product
  policy.

---

### Task 1: Option Normalization Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_runs/options.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_runs.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options` owns CLI
parsing, report and surface aliases, report and resume defaults, limit and age
bounds, and normalized option projection. The facade retains public dispatch.

- [ ] Run the named suite as the green characterization baseline.
- [ ] Add a facade delegation to the not-yet-created `Options` owner and run
  the suite to observe the expected missing-owner failure.
- [ ] Move parsing and normalization into `Options` without changing values or
  errors.
- [ ] Re-run the suite and confirm report selection, aliases, defaults, bounds,
  and resume options remain unchanged.
- [ ] Commit with message `refactor: isolate CJ runs options`.

### Task 2: Run Reporting Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_runs/reports.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_runs.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_runs/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjRuns.Reports` owns latest,
history, and failed-run queries, readiness enforcement, discovery candidate
counts, redacted run projection, and report rendering. The facade retains
`run_report/1`.

- [ ] Run the named suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner failure.
- [ ] Move report queries, validation, and rendering into `Reports` without
  changing query ordering, counts, output, or raised errors.
- [ ] Re-run the suite and confirm latest, history, failed, require-success,
  require-clean, freshness, and redaction behavior remain unchanged.
- [ ] Commit with message `refactor: isolate CJ runs reports`.

### Task 3: Resume Orchestration Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_runs/resume.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_runs.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_runs/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_runs_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjRuns.Resume` owns latest
successful-run lookup, cursor handling, import and discovery option
reconstruction, callback execution, safe exception logging, and resume output.
The facade retains `run_resume/1`.

- [ ] Run the named suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner failure.
- [ ] Move resume orchestration into `Resume` without changing public results,
  runner inputs, defaults, cursor behavior, output, or redacted log context.
- [ ] Re-run the suite and confirm import/discovery resume, legacy query
  reconstruction, missing cursors, runner errors, and secret safety.
- [ ] Commit with message `refactor: isolate CJ runs resume orchestration`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/cj-runs-task-decomposition.md`

- [ ] Run the exact 10-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm the runbook and application code reference only the stable Mix
  task and that no external caller references `Options`, `Reports`, or
  `Resume`.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
