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

### 27. Commerce Identifier Storage Integrity

Status: ready
Lane: Commerce identifier storage integrity
Plan: `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
Batch outcome: PostgreSQL preserves the established merchant-slug and
affiliate-network-code formats when writes bypass their changesets.
Next action: add failing direct-write tests for malformed merchant slugs and
affiliate network codes before adding the named forward checks.
Owned paths:

- `priv/repo/migrations/20260805060000_enforce_commerce_identifier_storage_integrity.exs`
- `lib/product_compare_schemas/pricing/merchant.ex`
- `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- `test/product_compare/repo/commerce_identifier_storage_integrity_test.exs`
- `test/product_compare/pricing/merchant_detail_test.exs`
- `test/product_compare/affiliate/affiliate_workflows_test.exs`
- `docs/work/commerce-identifier-storage-integrity.md`
- `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`

Internal slices:

- Failing direct-write identifier characterization and accepted controls.
- Two named forward checks and their owning changeset mappings.
- Merchant lookup and affiliate-upsert parity plus complete verification.

Prerequisites:

- Merchant slugs retain lowercase hyphen-separated syntax and affiliate network
  codes retain lowercase underscore-separated syntax.
- Existing normalization, uniqueness, lookup, and upsert behavior remains
  unchanged.
- No active row owns these schemas and no current identifier violates its rule.

Verification:

- focused direct-write commerce-identifier suite
- merchant-detail and affiliate-workflow suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects malformed direct commerce identifiers,
valid identifiers and existing commerce behavior remain unchanged, and all
backend gates pass.

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
- affected community lifecycle and GraphQL content tests
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
- affected CJ run-health, scheduled-cursor, reconciliation, and source-health
  tests
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

## Needs Decision Work

None.

## Blocked Work

None.
