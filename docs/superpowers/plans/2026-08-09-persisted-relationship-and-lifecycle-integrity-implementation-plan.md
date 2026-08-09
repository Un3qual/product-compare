# Core Persisted Lifecycle And Claim Integrity Implementation Plan

**Goal:** Make PostgreSQL preserve two established core-data contracts that
application code already enforces: terminal ingestion timestamps and
product-attribute claim scope.

**Architecture:** Treat the two domain boundaries as internal slices of one
storage-integrity outcome. Characterize all direct-write gaps first, then add
small named constraints in separate migrations owned by each domain and map
their failures through the owning changesets. Preserve existing deletion,
locking, and lifecycle behavior; do not introduce a generic integrity layer.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL checks and composite foreign keys,
ExUnit.

## Global Constraints

- Never rewrite or delete durable data to make a migration pass. Stop on a
  nonzero preflight and report the exact affected identifiers.
- Keep `finished_at` nullable for `running` ingestion rows and require it only
  for `succeeded` and `failed` rows. Add no ordering or retry policy.
- Preserve claim-deletion `ON DELETE CASCADE`, independent product and attribute
  foreign keys, application transaction locks, and claim lifecycle policy.
- Add named, reversible domain constraints and owning changeset mappings. Add no
  repository queries, data-repair path, trigger framework, or generic storage
  abstraction.
- Use milestone commits for characterization and implementation; the internal
  slices do not become separate dispatch rows.

## Owned Paths

- `priv/repo/migrations/20260805040000_enforce_ingestion_run_terminal_timestamp_integrity.exs`
- `priv/repo/migrations/20260805060000_enforce_product_attribute_claim_scope_integrity.exs`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `lib/product_compare_schemas/specs/product_attribute_current.ex`
- `lib/product_compare_schemas/specs/specification_correction.ex`
- `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- `test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`
- `test/product_compare/ingestion/cj_run_readiness_test.exs`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `test/product_compare/ingestion/scheduled_cursor_test.exs`
- `test/product_compare/ingestion/reconciliation_test.exs`
- `test/product_compare/ingestion/source_health_test.exs`
- `test/product_compare/cj_ingestion_cleanup_test.exs`
- `test/product_compare/specs/current_claim_selection_test.exs`
- `test/product_compare/specs/corrections_test.exs`
- `test/product_compare/specs/concurrency_test.exs`
- `test/product_compare/specs/read_helpers_test.exs`
- `test/product_compare/ingestion/enrichment_test.exs`
- `test/product_compare/repo/seeds_test.exs`
- `test/product_compare/catalog/filter_metadata_test.exs`
- `test/product_compare/catalog/filtering_regression_test.exs`
- `test/product_compare/recommendations_test.exs`
- `test/product_compare/comparison_snapshots_test.exs`
- `test/product_compare/seo_test.exs`
- `test/product_compare_web/graphql/catalog_queries_test.exs`
- `docs/work/persisted-relationship-and-lifecycle-integrity.md`
- `docs/superpowers/plans/2026-08-09-persisted-relationship-and-lifecycle-integrity-implementation-plan.md`

## Internal Slices

1. Ingestion terminal state: require completion timestamps on terminal rows and
   correct the one readiness fixture that currently persists an unfinished
   success.
2. Specification claim scope: require current selections and corrections to
   reference claims with the same product and attribute while preserving claim
   deletion cascades.

## Task 1: Preflight And Characterize Both Boundaries

- [ ] Run both read-only preflights immediately before implementation: zero
  terminal ingestion rows with null `finished_at`, and zero product or
  attribute mismatches in both claim dependents. Confirm the two existing claim
  foreign keys still use `ON DELETE CASCADE`.
- [ ] Add direct-write tests proving the missing enforcement:
  null timestamps for both terminal ingestion statuses, and product and
  attribute mismatch writes for each claim dependent.
- [ ] Add accepted controls for unfinished running and timestamped terminal
  ingestion rows, exact-scope claim rows, and claim-deletion cascades.
- [ ] Run the two new direct-write files together and observe only the planned
  mismatch assertions fail before production changes.
- [ ] Run the existing ingestion readiness, current-selection, and correction
  baselines; stop on unrelated failures.
- [ ] Commit the characterization milestone.

## Task 2: Add And Map The Named Storage Constraints

- [ ] Add `ingestion_runs_terminal_finished_at_required` with
  `status = 'running' OR finished_at IS NOT NULL`, map it to `:finished_at`, and
  change the invalid readiness fixture from unfinished `succeeded` to
  unfinished `running`.
- [ ] Add unique target `product_attribute_claims_product_attribute_id_uq` on
  `(product_id, attribute_id, id)`. Replace the two single-column claim foreign
  keys with `product_attribute_current_claim_scope_fkey` and
  `specification_corrections_claim_scope_fkey` over
  `(product_id, attribute_id, claim_id)`, preserving `ON DELETE CASCADE`, and
  map both failures to `:claim_id`.
- [ ] Implement dependency-safe `down/0` paths: drop composite dependents before
  unique targets and restore both original claim foreign keys with cascades.
- [ ] Apply the test migrations, run both direct-write files together, and
  require every planned rejection and accepted control to pass.
- [ ] Run the owning ingestion readiness, current-selection, and correction
  suites; commit the implementation milestone.

## Task 3: Verify The Combined Outcome And Close It Once

- [ ] Run the affected ingestion suites: CJ readiness and run health,
  scheduled cursor, reconciliation, source health, and CJ cleanup.
- [ ] Run the affected specification consumers: claim concurrency and reads,
  enrichment, seeds, filtering, recommendations, snapshots, SEO, and GraphQL
  catalog queries.
- [ ] Run `mix test`, `mix typecheck`, `mix quality`,
  `mix format --check-formatted`, `mix work_queue.validate`, and
  `git diff --check`.
- [ ] Record one combined completion entry and remove this one ready row at the
  coordinator boundary. Do not create two separate closeout batches.

Exit condition: direct PostgreSQL writes cannot persist terminal ingestion
without a completion timestamp or cross-wire a claim's product-and-attribute
scope; all accepted controls and affected domain behavior remain unchanged; and
the complete repository gates pass.
