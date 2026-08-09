# Persisted Relationship And Lifecycle Integrity Implementation Plan

**Goal:** Make PostgreSQL preserve three established cross-record and lifecycle
contracts that application code already enforces: same-thread post ancestry,
terminal ingestion timestamps, and product-attribute claim scope.

**Architecture:** Treat the three domain boundaries as internal slices of one
storage-integrity outcome. Characterize all direct-write gaps first, then add
small named constraints in separate migrations owned by each domain and map
their failures through the owning changesets. Preserve existing deletion,
locking, and lifecycle behavior; do not introduce a generic integrity layer.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL checks and composite foreign keys,
ExUnit.

## Global Constraints

- Never rewrite or delete durable data to make a migration pass. Stop on a
  nonzero preflight and report the exact affected identifiers.
- Keep thread roots nullable, preserve parent deletion and application cycle
  protection, and add no hierarchy trigger or reply-depth policy.
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
- `priv/repo/migrations/20260805070000_enforce_thread_post_parent_scope_integrity.exs`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `lib/product_compare_schemas/specs/product_attribute_current.ex`
- `lib/product_compare_schemas/specs/specification_correction.ex`
- `lib/product_compare_schemas/discussions/thread_post.ex`
- `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- `test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`
- `test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs`
- `test/product_compare/ingestion/cj_run_readiness_test.exs`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `test/product_compare/ingestion/scheduled_cursor_test.exs`
- `test/product_compare/ingestion/reconciliation_test.exs`
- `test/product_compare/ingestion/source_health_test.exs`
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
- `test/product_compare/discussions/thread_post_validation_test.exs`
- `test/product_compare/discussions/content_lifecycle_test.exs`
- `test/product_compare/discussions/community_trust_test.exs`
- `test/product_compare_web/graphql/community_content_test.exs`
- `docs/work/persisted-relationship-and-lifecycle-integrity.md`
- `docs/superpowers/plans/2026-08-09-persisted-relationship-and-lifecycle-integrity-implementation-plan.md`

## Internal Slices

1. Community parent scope: require every non-null parent to share the child's
   thread while preserving root posts, parent deletion, self-parent checks, and
   application-owned cycle detection.
2. Ingestion terminal state: require completion timestamps on terminal rows and
   correct the one readiness fixture that currently persists an unfinished
   success.
3. Specification claim scope: require current selections and corrections to
   reference claims with the same product and attribute while preserving claim
   deletion cascades.

## Task 1: Preflight And Characterize All Three Boundaries

- [ ] Run the three read-only preflights immediately before implementation:
  zero cross-thread post parents; zero terminal ingestion rows with null
  `finished_at`; and zero product or attribute mismatches in both claim
  dependents. Confirm the two existing claim foreign keys still use
  `ON DELETE CASCADE`.
- [ ] Add direct-write tests proving the missing enforcement:
  cross-thread parent assignment; null timestamps for both terminal ingestion
  statuses; and product and attribute mismatch writes for each claim dependent.
- [ ] Add accepted controls for root and same-thread posts plus parent deletion;
  unfinished running and timestamped terminal ingestion rows; exact-scope claim
  rows and claim-deletion cascades.
- [ ] Run the three new direct-write files together and observe only the planned
  mismatch assertions fail before production changes.
- [ ] Run the existing parent, ingestion readiness, current-selection, and
  correction baselines; stop on unrelated failures.
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
- [ ] Add unique target `thread_posts_thread_id_id_uq` and
  `thread_posts_parent_same_thread_fkey` from `(thread_id, parent_post_id)` to
  `thread_posts(thread_id, id)` with `ON DELETE SET NULL (parent_post_id)`.
  Retain the existing parent foreign key and map the composite failure to
  `:parent_post_id`.
- [ ] Implement dependency-safe `down/0` paths: drop composite dependents before
  unique targets and restore both original claim foreign keys with cascades.
- [ ] Apply the test migrations, run all three direct-write files together, and
  require every planned rejection and accepted control to pass.
- [ ] Run the owning parent, ingestion readiness, current-selection, and
  correction suites; commit the implementation milestone.

## Task 3: Verify The Combined Outcome And Close It Once

- [ ] Run the affected community suites:
  `thread_post_validation_test.exs`, `content_lifecycle_test.exs`,
  `community_trust_test.exs`, and GraphQL `community_content_test.exs`.
- [ ] Run the affected ingestion suites: CJ readiness and run health,
  scheduled cursor, reconciliation, and source health.
- [ ] Run the affected specification consumers: claim concurrency and reads,
  enrichment, seeds, filtering, recommendations, snapshots, SEO, and GraphQL
  catalog queries.
- [ ] Run `mix test`, `mix typecheck`, `mix quality`,
  `mix format --check-formatted`, `mix work_queue.validate`, and
  `git diff --check`.
- [ ] Record one combined completion entry and remove this one ready row at the
  coordinator boundary. Do not create three separate closeout batches.

Exit condition: direct PostgreSQL writes cannot cross a thread's parent scope,
persist terminal ingestion without a completion timestamp, or cross-wire a
claim's product-and-attribute scope; all accepted controls and affected domain
behavior remain unchanged; and the complete repository gates pass.
