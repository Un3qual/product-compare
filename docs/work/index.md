# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary unless a complete `Ready Floor Exception` records why the
  repository currently supports fewer coherent outcomes.
- Three is the replenishment floor, not a target or maximum. Promote every
  useful, currently validated candidate whose ownership and prerequisites make
  it executable.
- A queue row is one independently shippable and reviewable outcome. Per-file,
  per-route, path-disjoint, or test-sized implementation steps belong under
  internal slices in the linked plan and lane doc.
- Group candidates that enforce the same invariant and share one acceptance
  boundary. Parallel safety alone does not justify separate queue rows.
- Numeric batch requests and the ready-row floor never justify micro-batches or
  filler. Return fewer coherent batches and record the missing decision when
  the repository does not support the requested count.
- Before a claim would leave fewer than three other ready rows, the coordinator
  validates and promotes more work or commits a complete ready floor exception
  in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue satisfies the floor or its explicit exception.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row when three other ready
  rows will remain or the ready floor exception covers the smaller truthful set.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

None.

## Ready Work

### Core Persisted Lifecycle And Claim Integrity

Status: ready
Lane: Core data integrity
Plan: `docs/superpowers/plans/2026-08-09-persisted-relationship-and-lifecycle-integrity-implementation-plan.md`
Batch outcome: PostgreSQL preserves existing ingestion terminal-state and
specification claim-scope contracts when writes bypass application changesets.
Next action: run both clean preflights, then add the combined failing
direct-write characterization before changing production schemas or migrations.
Owned paths:

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

Internal slices:

- Terminal ingestion timestamp enforcement with running and timestamped-terminal
  controls plus the truthful readiness fixture.
- Product-attribute claim-scope composite referential integrity for both
  dependents with exact-scope and claim-deletion cascade controls.

Prerequisites:

- Both recorded preflights remain clean and the original claim foreign
  keys retain `ON DELETE CASCADE`.
- The ingestion and specification baseline suites still pass.
- No active row owns any listed schema, migration, or affected test path.

Verification:

- two direct-write storage suites and their accepted controls
- owning ingestion and specification lifecycle suites
- affected seed, catalog, recommendation, snapshot, SEO, and GraphQL consumers
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects invalid terminal ingestion and claim-scope
states under their named constraints, accepted and deletion boundaries retain
current behavior, and all affected and repository gates pass.

## Ready Floor Exception

Reason: Current validation supports one substantial core data-integrity outcome;
identifier candidates still need product decisions and discussion work is
explicitly deferred.
Rejected split: Terminal timestamps and claim scope are internal
migration-and-test slices of the combined outcome, not separate batches.
Replenishment action: Audit current product behavior and architecture gaps for
the next independently shippable non-discussion outcome while the combined row
executes, and reassess commerce identifiers only after their end-anchor decision
is recorded.

## Needs Decision Work

### Commerce Identifier Storage Integrity

Status: needs_decision
Lane: Commerce identifier storage integrity
Plan: `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
Decision: choose whether canonical merchant slugs reject a single trailing
newline, then align the application and database end anchors before replanning.
Evidence: `Merchant.changeset/2` uses PCRE `$` and accepts `"north-main\n"`,
while the proposed PostgreSQL slug predicate rejects that value. The current
draft is not executable and cannot count toward the ready-row floor.

## Blocked Work

None.
