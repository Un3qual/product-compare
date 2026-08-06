# Work Dispatch Index

Start here. This file is the only live dispatch queue.

For the operating rules, prompt templates, and handoff format, read
`docs/work/operating-model.md`.

Completion and coordination records removed from this live surface are
preserved in `docs/plans/2026-07-31-work-index-history.md`.

## Queue Rules

- A worker should execute only rows with `Status: ready`.
- At least three complete `ready` implementation rows must exist at every stable
  dispatch boundary.
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
  validates and promotes more work in the same dispatch update.
- Before removing completed or blocked work, preserve truthful lane evidence
  and ensure the committed queue still satisfies the floor.
- `needs_decision` rows are coordinator work: resolve the decision, then promote
  every useful source-backed candidate made executable by it.
- `blocked` rows need external evidence or a product decision. Do not code around
  them.
- Workers claim the highest-ranked compatible `ready` row only when three other
  ready rows will remain.
- Dependent, deferred, rejected, blocked, speculative, stale, and unverified
  work cannot be used as queue-depth filler.
- `active` rows are already owned by a named worker or branch. Do not start a
  second worker on them unless the coordinator reassigns the row.
- Completed lanes do not stay in this queue. Their history remains in the lane
  work doc and dated plan archive.

## Active Work

None.

## Ready Work

### 28. Thread Post Parent Scope Storage Integrity

Status: ready
Lane: Community relationship storage integrity
Plan: `docs/superpowers/plans/2026-08-05-thread-post-parent-scope-storage-integrity-implementation-plan.md`
Batch outcome: PostgreSQL permits root posts and requires every non-null parent
post to belong to the same thread as its child.
Next action: add a failing direct-write cross-thread parent test plus null,
same-thread, and parent-deletion controls before adding the composite foreign
key.
Owned paths:

- `priv/repo/migrations/20260805070000_enforce_thread_post_parent_scope_integrity.exs`
- `lib/product_compare_schemas/discussions/thread_post.ex`
- `test/product_compare/repo/thread_post_parent_scope_storage_integrity_test.exs`
- `test/product_compare/discussions/thread_post_validation_test.exs`
- `test/product_compare/discussions/content_lifecycle_test.exs`
- `test/product_compare/discussions/community_trust_test.exs`
- `test/product_compare_web/graphql/community_content_test.exs`
- `docs/work/thread-post-parent-scope-storage-integrity.md`
- `docs/superpowers/plans/2026-08-05-thread-post-parent-scope-storage-integrity-implementation-plan.md`

Internal slices:

- Failing cross-thread characterization with accepted and deletion controls.
- Unique composite target, same-thread foreign key, and owning schema mapping.
- Existing self-parent/cycle behavior and community lifecycle parity.

Prerequisites:

- `parent_post_id` remains nullable and parent deletion continues to null only
  that column.
- Existing self-parent checks and application cycle locking remain unchanged.
- No active row owns ThreadPost when this row is claimed and no current parent
  crosses thread scope.

Verification:

- focused direct-write parent-scope suite
- thread-post validation, community lifecycle/trust, and GraphQL content suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects cross-thread parent references, root and
same-thread posts plus parent deletion retain current behavior, and all backend
gates pass.

### 29. Ingestion Run Terminal Timestamp Integrity

Status: ready
Lane: Ingestion storage integrity
Plan: `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`
Batch outcome: PostgreSQL requires completion timestamps for terminal
ingestion runs while preserving nullable `finished_at` for running rows.
Next action: add failing direct-write tests for timestamp-free `succeeded` and
`failed` rows before adding the named forward check.
Owned paths:

- `priv/repo/migrations/20260805040000_enforce_ingestion_run_terminal_timestamp_integrity.exs`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- `test/product_compare/ingestion/cj_run_readiness_test.exs`
- `test/product_compare/ingestion/cj_run_health_test.exs`
- `test/product_compare/ingestion/scheduled_cursor_test.exs`
- `test/product_compare/ingestion/reconciliation_test.exs`
- `test/product_compare/ingestion/source_health_test.exs`
- `docs/work/ingestion-run-terminal-timestamp-integrity.md`
- `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`

Internal slices:

- Failing direct-write terminal-timestamp characterization and valid controls.
- One named forward check and owning changeset mapping.
- Truthful CJ readiness fixture plus ingestion lifecycle parity and complete
  backend verification.

Prerequisites:

- `finished_at` remains nullable for running rows and is required only for
  `succeeded` and `failed` rows.
- No active row owns the ImportRun schema or affected ingestion tests.
- No current terminal row has a null completion timestamp.

Verification:

- focused direct-write terminal-timestamp suite
- CJ readiness/run-health, scheduled-cursor, reconciliation, and source-health
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects timestamp-free terminal runs, accepts
unfinished running rows and timestamped terminal rows, readiness fixtures remain
truthful, and all backend gates pass.

### 30. Product Attribute Claim Scope Storage Integrity

Status: ready
Lane: Specification claim referential integrity
Plan: `docs/superpowers/plans/2026-08-06-product-attribute-claim-scope-storage-integrity-implementation-plan.md`
Batch outcome: PostgreSQL requires current selections and specification
corrections to reference claims from the same product-and-attribute scope.
Next action: add failing direct-write tests for product and attribute mismatches
on both dependent tables before replacing their claim foreign keys.
Owned paths:

- `priv/repo/migrations/20260805060000_enforce_product_attribute_claim_scope_integrity.exs`
- `lib/product_compare_schemas/specs/product_attribute_current.ex`
- `lib/product_compare_schemas/specs/specification_correction.ex`
- `test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`
- `docs/work/product-attribute-claim-scope-storage-integrity.md`
- `docs/superpowers/plans/2026-08-06-product-attribute-claim-scope-storage-integrity-implementation-plan.md`

Internal slices:

- Clean live preflight, focused baseline, and eight direct-write boundaries.
- One composite claim-scope target plus two named composite foreign keys and
  owning changeset mappings.
- Claim, correction, ingestion, seed, read-consumer, and complete repository
  verification.

Prerequisites:

- Both dependents retain `ON DELETE CASCADE` when their referenced claim is
  deleted.
- Live preflight returns zero mismatches and both original claim foreign keys
  have the expected names and cascade action.
- No active row owns the two dependent schemas or proposed migration path.

Verification:

- focused direct-write, current-claim selection, and correction suites
- claim concurrency/read, enrichment, seed, catalog, recommendation, snapshot,
  SEO, and GraphQL consumer suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects both scope-mismatch dimensions for both
dependent tables, exact-scope rows and claim-deletion cascades retain current
behavior, and all backend gates pass.

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
