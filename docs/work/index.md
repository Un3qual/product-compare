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

### 23. Taxon Attribute Storage Bounds

Status: active
Owner: Codex `/root` in the detached workspace at
`/Users/admin/.codex/worktrees/5ad5/backend`
Lane: Taxonomy storage integrity
Plan: `docs/superpowers/plans/2026-08-05-taxon-attribute-storage-bounds-implementation-plan.md`
Batch outcome: PostgreSQL preserves non-negative taxonomy display ordering and
reputation thresholds even when a write bypasses application changesets.
Next action: add failing direct-write tests for negative `sort_order` and
`min_rep_to_edit` values before adding the named forward constraints.
Owned paths:

- `priv/repo/migrations/20260805000000_enforce_taxon_attribute_storage_bounds.exs`
- `lib/product_compare_schemas/specs/taxon_attribute.ex`
- `test/product_compare/repo/taxon_attribute_storage_bounds_test.exs`
- affected TaxonAttribute changeset, current-attribute read, and catalog
  GraphQL tests
- `docs/work/taxon-attribute-storage-bounds.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/plans/2026-08-05-taxon-attribute-storage-bounds-implementation-plan.md`

Internal slices:

- Failing direct-write negative-value characterization and valid boundaries.
- Named forward constraints and owning changeset mappings.
- Current-attribute read and GraphQL parity plus complete backend verification.

Prerequisites:

- `sort_order` and `min_rep_to_edit` retain zero defaults and non-negative
  application validations.
- No active row owns TaxonAttribute schemas, migrations, or affected tests.
- No current row contains a negative value in either field.

Verification:

- focused TaxonAttribute direct-write suite
- TaxonAttribute changeset, current-attribute read, and catalog GraphQL suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects negative taxonomy ordering and reputation
thresholds, zero and positive values and current ordering remain unchanged, and
all backend gates pass.

## Ready Work

### 24. Community Authored Text Storage Bounds

Status: ready
Lane: Community content storage integrity
Plan: `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`
Batch outcome: PostgreSQL and the owning changesets retain established Unicode
code-point bounds for authored threads, posts, reviews, and reports.
Next action: add failing direct- and application-write tests for code-point
boundaries, including decomposed combining text and emoji ZWJ sequences, before
changing all six owning validations and adding the named forward checks.
Owned paths:

- `priv/repo/migrations/20260805010000_enforce_community_authored_text_storage_bounds.exs`
- `lib/product_compare_schemas/discussions/product_thread.ex`
- `lib/product_compare_schemas/discussions/thread_post.ex`
- `lib/product_compare_schemas/discussions/product_review.ex`
- `lib/product_compare_schemas/discussions/community_report.ex`
- `test/product_compare/repo/community_authored_text_storage_bounds_test.exs`
- affected community lifecycle, thread-post validation, trust, GraphQL
  community, node-query, Dataloader, and seed tests
- `docs/work/community-authored-text-storage-bounds.md`
- `docs/superpowers/plans/2026-08-05-community-authored-text-storage-bounds-implementation-plan.md`

Internal slices:

- Failing direct- and application-write code-point boundary characterization.
- Six explicit code-point changeset validations, named forward checks, and
  owning constraint mappings.
- Community lifecycle parity and complete backend verification.

Prerequisites:

- The approved canonical unit is Unicode code points; all six owning
  `validate_length/3` calls change to `count: :codepoints` while their numeric
  limits, nullability, and required-field behavior remain unchanged.
- The existing report-reason `varchar(500)` upper bound remains intact.
- No active row owns community schemas, migrations, or affected tests.
- No current community row violates one of the six missing boundaries.

Verification:

- focused community-authored-text direct- and application-write suites with
  decomposed combining text and emoji ZWJ boundaries
- content lifecycle, thread-post validation, community trust, GraphQL
  community content, node-query, Dataloader batching, and deterministic seed
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL and application changesets agree on every Unicode
code-point boundary, valid authored text remains accepted without rewriting,
community behavior is otherwise unchanged, and all backend gates pass.

### 25. Specification Definition Creation Validity

Status: ready
Lane: Specification definition storage integrity
Plan: `docs/superpowers/plans/2026-08-05-specification-definition-creation-validity-implementation-plan.md`
Batch outcome: PostgreSQL requires valid enum ownership and nonzero unit
conversion multipliers when specification definitions are first inserted.
Next action: add failing direct-write tests for enum attributes without enum
sets, non-enum attributes with enum sets, and zero unit multipliers before
adding the named forward checks.
Owned paths:

- `priv/repo/migrations/20260805030000_enforce_specification_definition_creation_validity.exs`
- `lib/product_compare_schemas/specs/attribute.ex`
- `lib/product_compare_schemas/specs/unit.ex`
- `test/product_compare/repo/specification_definition_creation_validity_test.exs`
- `test/product_compare/specs/definition_semantics_test.exs`
- `test/product_compare/specs/unit_conversion_test.exs`
- `docs/work/specification-definition-creation-validity.md`
- `docs/superpowers/plans/2026-08-05-specification-definition-creation-validity-implementation-plan.md`

Internal slices:

- Failing direct-write definition characterization with valid controls.
- Named forward constraints and owning changeset mappings.
- Definition immutability and unit-conversion parity plus complete verification.

Prerequisites:

- Enum attributes require an enum set, non-enum attributes forbid one, and
  unit conversion multipliers remain nonzero.
- Existing definition immutability triggers and application validations remain
  unchanged.
- No active row owns Attribute or Unit storage and no current definition
  violates the established creation rules.

Verification:

- focused direct-write specification-definition suite
- definition-semantics and unit-conversion suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects invalid newly inserted attributes and units,
valid definitions and existing immutability behavior remain unchanged, and all
backend gates pass.

### 26. User Email Shape Storage Integrity

Status: ready
Lane: Accounts identity storage integrity
Plan: `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`
Batch outcome: PostgreSQL preserves the existing non-whitespace, contains-`@`
shape of persisted user identities even for direct writes.
Next action: add failing direct-write tests for whitespace-containing and
`@`-free emails before adding the named forward check.
Owned paths:

- `priv/repo/migrations/20260805050000_enforce_user_email_shape_integrity.exs`
- `lib/product_compare_schemas/accounts/user.ex`
- `test/product_compare/repo/user_email_shape_storage_integrity_test.exs`
- `test/product_compare/accounts/user_auth_schema_test.exs`
- affected Accounts authentication and GraphQL browser-auth tests
- `docs/work/user-email-shape-storage-integrity.md`
- `docs/superpowers/plans/2026-08-05-user-email-shape-storage-integrity-implementation-plan.md`

Internal slices:

- Failing direct-write email-shape characterization and valid control.
- One named forward check and both owning changeset mappings.
- Accounts lifecycle parity and complete backend verification.

Prerequisites:

- The established email rule remains at least one `@` and no whitespace.
- Normalization, `citext` uniqueness, and browser-auth behavior remain unchanged.
- No active row owns User storage and no current email violates the rule.

Verification:

- focused direct-write user-email suite
- Accounts schema, authentication, session, token, and GraphQL auth suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects persisted emails outside the established
shape, existing valid identities and authentication behavior remain unchanged,
and all backend gates pass.

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
