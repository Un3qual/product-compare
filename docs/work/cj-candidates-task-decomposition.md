# CJ Candidates Task Decomposition

## Snapshot

- Status: active
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

## Internal Slices

1. CLI/default/report/status/format normalization and bounds.
2. Stale-candidate selection, freshness validation, and safe line output.
3. Fit-gap selection, classification, aggregation, and safe line output.
4. Application-cohort filters plus line and Markdown output.
5. Stable Mix-task facade, runbook boundary, and caller parity.

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
