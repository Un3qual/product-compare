# CJ Import Task Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `Mix.Tasks.ProductCompare.Ingestion.CjImport` as the stable
manual, worker, and resume entry point while moving option normalization,
durable page imports, and reviewed-candidate batching into focused internal
modules.

**Architecture:** The Mix task retains `run/1`, `run_import/1`, output, and
error presentation. Three internal owners receive the existing implementation
by responsibility: `Options` for normalized input and credential readiness,
`Runner` for one durable import run, and `Candidates` for deterministic
reviewed-candidate selection and aggregate execution.

**Tech Stack:** Elixir, Mix, Ecto, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `run/1` and `run_import/1`, their accepted keyword and CLI inputs,
  return values, raised errors, and printed output.
- Preserve source resolution, cursor and page bounds, import-run queries and
  finalization, complete-scope reconciliation, record counts, partial-failure
  categories, and runner-exception redaction.
- Preserve candidate filters, deterministic ordering, limits, skip behavior,
  aggregate reports, and explicit missing-feed failures.
- Preserve credential preflight behavior without printing or persisting
  secrets.
- Keep the Oban worker and `CjRuns` resume task dependent only on the stable
  `CjImport.run_import/1` entry point.
- Do not change CJ provider requests, ingestion persistence, schemas,
  migrations, scheduling, dashboard/operator scope, or product policy.

---

### Task 1: Option And Credential Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_import/options.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjImport.Options` owns CLI
parsing, defaults, keyword normalization, fetch-option projection, explicit
feed-ID validation, page bounds, and credential readiness projection. The
facade retains public task execution and output.

- [ ] Run the named suite as the green characterization baseline.
- [ ] Move parsing, normalization, defaults, fetch-option construction, and
  credential projection into `Options` without changing values or errors.
- [ ] Keep `run/1` and `run_import/1` in the facade and delegate only normalized
  input work.
- [ ] Re-run the suite and confirm defaults, explicit feed IDs, credential
  preflight, readiness enforcement, and secret-safe output remain unchanged.
- [ ] Commit with message `refactor: isolate CJ import options`.

### Task 2: Durable Import Runner Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_import/runner.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_import/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjImport.Runner` owns one
source import: source resolution, durable run start/finalization, bounded page
fetching, record normalization/persistence, cursor handling, reconciliation
inputs, report aggregation, and redacted fetch failures. The facade retains
`run_import/1` and presentation.

- [ ] Run the named suite as the green characterization baseline.
- [ ] Move single-source import orchestration and report construction into
  `Runner` without changing transactions, query values, cursors, counts,
  failure categories, or completion status.
- [ ] Delegate from the facade while preserving callback injection and public
  result shapes.
- [ ] Re-run the suite and confirm one-page, bounded multi-page, complete-scope,
  row-failure, partial-fetch, and runner-exception behavior remains unchanged.
- [ ] Commit with message `refactor: isolate CJ import runner`.

### Task 3: Candidate Batch Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_import/candidates.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_import.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_import/runner.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_import_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjImport.Candidates` owns
candidate detection, deterministic query/filter/limit policy, candidate option
projection, per-candidate execution through `Runner`, aggregate counts, skips,
and explicit missing-feed errors. The facade retains public dispatch and
candidate-report presentation.

- [ ] Run the named suite as the green characterization baseline.
- [ ] Move candidate query, normalization, selection, execution, and aggregate
  result behavior into `Candidates`.
- [ ] Delegate candidate dispatch from the facade without exposing internal
  modules to the Oban worker or resume task.
- [ ] Re-run the suite and confirm explicit and reviewed candidate imports,
  ordering, limits, skipped feed IDs, failures, aggregate output, and
  not-found behavior remain unchanged.
- [ ] Commit with message `refactor: isolate CJ import candidates`.

### Task 4: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/cj-import-task-decomposition.md`

- [ ] Run the exact 19-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm the Oban worker and `CjRuns` reference only
  `CjImport.run_import/1`, and no external caller references `Options`,
  `Runner`, or `Candidates`.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
