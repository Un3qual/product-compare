# Application JSON Storage Policy Guard

## Snapshot

- Status: complete
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-07-30-application-json-storage-policy-guard-implementation-plan.md`
- Last verified: 2026-08-04 after a clean test-database rebuild, focused and
  owner-suite verification, and exact-head repository gates.
- Implementation commits: `4fa16461`, `cdc6353b`, `6549d4e2`, and `a26b0e8f`.

## Batch Outcome

Stable application-owned relational facts cannot regress into opaque JSON
columns. Persisted JSON remains possible only for an explicitly classified
raw, open-key, request-metadata, or JSON-typed value contract.

## Completed Evidence

- Compiled Ecto reflection now discovers every persisted `:map` field while
  excluding virtual projections. PostgreSQL catalog reflection independently
  discovers every application-owned `json`/`jsonb` column, and the policy
  compares those inventories in both directions.
- The six resulting contracts each have one narrow classification:
  - `commerce_links.campaign_params`
  - `commerce_conversions.raw_payload`
  - `ingestion_runs.query`
  - `merchant_feed_candidates.raw_metadata`
  - `product_attribute_claims.value_json`
  - `source_artifacts.raw_json`
- Exact framework exclusions cover only `oban_jobs.args` and `oban_jobs.meta`;
  future JSON columns on framework tables remain subject to the default-deny
  catalog policy.
- Synthetic Ecto-only, catalog-only, matched-but-unclassified, renamed-source,
  and framework-column regressions produce field-specific actionable errors.
- `comparison_snapshots.payload` remains the sole virtual `:map` projection,
  and direct regressions keep `comparison_snapshots.payload` and
  `alert_events.fact_snapshot` absent from persisted storage.
- Public GraphQL shapes and legitimate provider evidence, request metadata,
  campaign parameters, and declared JSON specification values did not change.

## Boundaries

- Preserve provider-owned raw evidence and request metadata.
- Preserve open campaign parameters and explicitly JSON-typed specification
  values.
- Do not infer that every map is bad; require a named semantic reason.
- Do not alter domain storage in this guard batch unless characterization
  exposes a current unclassified violation.
- Keep public GraphQL behavior unchanged.

## Internal Slices

1. Compiled persisted-map and PostgreSQL JSON catalog inventory.
2. Explicit semantic classification with default-deny drift detection.
3. Former snapshot/alert dump regressions and full storage-owner verification.

## Verification

- `MIX_ENV=test mix ecto.reset`: dropped, recreated, and migrated only the test
  database; exit `0`.
- `mix test test/product_compare/repo/application_json_domain_storage_test.exs`:
  7 tests, 0 failures after the reset and again on exact head.
- Comparison snapshot owner paths: 15 tests, 0 failures.
- Alert owner paths: 15 tests, 0 failures.
- Specification owner paths: 68 tests, 0 failures.
- Ingestion owner paths: 184 tests, 0 failures.
- Commerce-attribution owner paths: 126 tests, 0 failures.
- Exact-head `mix test`: 1,202 tests, 0 failures.
- Exact-head `mix quality`: exit `0`; Credo found no issues, the clone budget
  remained 3/3, cross-function smell detection found no issues, and Dialyzer
  passed successfully.
- Exact-head `mix typecheck` and `mix format --check-formatted`: exit `0` with
  no output.
- `mix work_queue.validate`: `work queue valid: 3 ready rows`.
- `git diff --check`: exit `0` before closeout.

## Concerns

None. The initial quality review found two policy-helper refactoring issues;
`a26b0e8f` repaired them without changing policy behavior, and fresh quality,
full-test, focused-test, type, formatting, queue, and diff gates passed on that
exact head.
