# CJ Candidates Task Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `Mix.Tasks.ProductCompare.Ingestion.CjCandidates` as the stable
operator entry point while moving option normalization and the three supported
reports into focused internal modules.

**Architecture:** The Mix task retains `run/1` and `run_report/1` as the
caller-facing boundary. `Options` owns CLI and keyword normalization, while
`StaleReport`, `FitGapReport`, and `ApplicationCohortReport` each own one
query, policy, and output contract.

**Tech Stack:** Elixir, Mix, Ecto, PostgreSQL, ExUnit.

## Global Constraints

- Preserve `run/1` and `run_report/1`, their accepted CLI and keyword inputs,
  return values, raised errors, and printed output.
- Preserve report and status defaults, supported aliases, limit and age bounds,
  market-filter normalization, candidate ordering, and required-result gates.
- Preserve Global ID encoding, fit-gap classification and aggregation, line
  and Markdown rendering, escaping, timestamps, and secret/raw-field
  redaction.
- Preserve the explicit rejection of the removed CSV export report.
- Keep the weekly operator runbook dependent only on the Mix task.
- Do not change CJ provider requests, ingestion persistence, schemas,
  migrations, candidate review policy, deferred operator scope, or product
  policy.

---

### Task 1: Option Normalization Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`

**Interfaces:** `Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options` owns
CLI parsing, report and status defaults, supported report and output formats,
limit and age bounds, market-filter normalization, and normalized option
projection. The facade retains public dispatch.

- [ ] Run the named suite as the green characterization baseline.
- [ ] Add a facade delegation to the not-yet-created `Options` owner and run
  the suite to observe the expected missing-owner failure.
- [ ] Move parsing and normalization into `Options` without changing values or
  errors.
- [ ] Re-run the suite and confirm report selection, defaults, filters, and the
  removed-export error remain unchanged.
- [ ] Commit with message `refactor: isolate CJ candidate options`.

### Task 2: Stale Report Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_candidates/stale_report.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`

**Interfaces:**
`Mix.Tasks.ProductCompare.Ingestion.CjCandidates.StaleReport` owns the cutoff,
provider and review-status query, deterministic ordering, freshness gate, safe
projection, and line rendering for the stale report.

- [ ] Run the named suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner failure.
- [ ] Move stale selection and rendering into `StaleReport` without changing
  cutoff, ordering, limits, errors, output, or redaction.
- [ ] Re-run the suite and confirm stale selection and safe output remain
  unchanged.
- [ ] Commit with message `refactor: isolate CJ candidate stale report`.

### Task 3: Fit-Gap Report Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_candidates/fit_gap_report.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`

**Interfaces:**
`Mix.Tasks.ProductCompare.Ingestion.CjCandidates.FitGapReport` owns candidate
selection, fit-gap classification and aggregation, safe candidate projection,
and line rendering for the fit-gap report.

- [ ] Run the named suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner failure.
- [ ] Move fit-gap selection, analysis, aggregation, and rendering into
  `FitGapReport` without changing sort, limit, counts, gap order, output, or
  redaction.
- [ ] Re-run the suite and confirm fit-gap summary and candidate output remain
  unchanged.
- [ ] Commit with message `refactor: isolate CJ candidate fit-gap report`.

### Task 4: Application Cohort Report Ownership

**Files:**

- Create: `lib/mix/tasks/product_compare/ingestion/cj_candidates/application_cohort_report.ex`
- Modify: `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex`
- Read: `lib/mix/tasks/product_compare/ingestion/cj_candidates/options.ex`
- Test: `test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`

**Interfaces:**
`Mix.Tasks.ProductCompare.Ingestion.CjCandidates.ApplicationCohortReport` owns
cohort selection, normalized market and minimum-count filters, required-result
validation, and line and Markdown rendering.

- [ ] Run the named suite before the extraction.
- [ ] Add the facade delegation and run the suite to observe the expected
  missing-owner failure.
- [ ] Move application-cohort selection and rendering into
  `ApplicationCohortReport` without changing filters, sort, limit, errors,
  formatting, escaping, output, or redaction.
- [ ] Re-run the suite and confirm status and market filtering plus line and
  Markdown output remain unchanged.
- [ ] Commit with message `refactor: isolate CJ candidate application cohort`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/cj-candidates-task-decomposition.md`

- [ ] Run the exact 6-test characterization command recorded in the lane doc.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm the runbook references only the stable Mix task and that no
  external caller references `Options`, `StaleReport`, `FitGapReport`, or
  `ApplicationCohortReport`.
- [ ] Record final ownership, facade size, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
