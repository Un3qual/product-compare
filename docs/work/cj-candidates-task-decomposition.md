# CJ Candidates Task Decomposition

## Snapshot

- Status: done
- Priority: P4
- Dispatch source of truth: `docs/work/index.md`
- Plan: `docs/superpowers/plans/2026-07-23-cj-candidates-task-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the dedicated CJ candidates Mix-task
  suite.

## Target Outcome

`Mix.Tasks.ProductCompare.Ingestion.CjCandidates` remains the stable operator
entry point while option normalization, stale reporting, fit-gap reporting,
and application-cohort reporting live in focused internal modules with
unchanged CLI behavior, queries, output, errors, filtering, and credential
safety.

## Ready Evidence

- `lib/mix/tasks/product_compare.ingestion.cj_candidates.ex` is 430 lines and
  combines four concrete implementation responsibilities behind stable
  `run/1` and `run_report/1` boundaries.
- The weekly operator runbook invokes only the Mix task.
- The dedicated characterization suite passed 6 tests on 2026-07-23.
- The row is path-disjoint from CJ Runs, Catalog Resolver, and Listing
  Persistence decomposition.
- This structural row does not reopen the rejected CSV export, provider,
  persistence, dashboard, operator-product, or product-policy work.

## Progress Evidence

- Claimed after Listing Persistence Decomposition completed with its exact
  characterization and full repository gates green.
- CLI parsing, report and status defaults, supported formats, bounds, and
  market-filter normalization now live in `CjCandidates.Options`.
- Stale-candidate selection, ordering, freshness enforcement, safe projection,
  and line rendering now live in `CjCandidates.StaleReport`.
- Fit-gap candidate selection, classification, aggregation, safe projection,
  and line rendering now live in `CjCandidates.FitGapReport`.
- Application-cohort selection, filters, required-result validation, and line
  and Markdown rendering now live in `CjCandidates.ApplicationCohortReport`.
- The first full gate identified two new exact-copy groups. Shared safe
  line-value and Markdown-cell serialization now live in the 31-line
  `CjCandidates.Output` owner, while market-value normalization is reused from
  `Options`; ExDNA returned to its 6/6 budget.
- The stable task facade is now 36 lines. `Options` is 104 lines,
  `StaleReport` is 73 lines, `FitGapReport` is 122 lines, and
  `ApplicationCohortReport` is 125 lines.
- The weekly operator runbook still invokes only
  `mix product_compare.ingestion.cj_candidates`; no application or test caller
  bypasses the facade to reference the focused report owners.
- The exact final characterization gate passed 6 tests on 2026-07-23.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `git diff --check`, and `mix ci` all passed on
  2026-07-23. The full gate passed 913 backend tests at 83.40% coverage, 1,507
  frontend tests, Relay validation, TypeScript, client and SSR production
  builds, and the client-bundle budget.

## Internal Slices

1. CLI/default/report/status/format normalization and bounds.
2. Stale-candidate selection, freshness validation, and safe line output.
3. Fit-gap selection, classification, aggregation, and safe line output.
4. Application-cohort filters plus line and Markdown output.
5. Shared safe line-value and Markdown-cell formatting.
6. Stable Mix-task facade, runbook boundary, and caller parity.

## Boundaries

- Preserve `run/1` and `run_report/1`, accepted inputs, returns, raised errors,
  and printed output.
- Preserve report and status defaults, supported formats, bounds, ordering,
  market filters, candidate counts, gap order, and required-result gates.
- Preserve Global IDs, escaping, timestamp and value formatting, and raw-field
  redaction.
- Preserve the explicit rejection of the removed CSV export report.
- Do not change provider requests, persistence, schemas, migrations, candidate
  review policy, deferred operator scope, or product policy.

## Verification

- `mix test test/mix/tasks/product_compare_ingestion_cj_candidates_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`
