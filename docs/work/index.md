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

### 22. Ingestion Run Request Bounds

Status: active
Lane: Ingestion storage integrity
Plan: `docs/superpowers/plans/2026-08-04-ingestion-run-request-bounds-implementation-plan.md`
Batch outcome: PostgreSQL retains the positive-when-present bounds of import-run
request metadata even when writes bypass application changesets.
Next action: add failing direct-write tests for zero and negative `page_size`
and `pages_requested` values before adding the named forward constraints.
Owned paths:

- `priv/repo/migrations/20260804230000_enforce_ingestion_run_request_bounds.exs`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `test/product_compare/repo/ingestion_run_request_bounds_test.exs`
- affected import-run, scheduled-cursor, reconciliation, source-health, and CJ
  run-health tests
- `docs/work/ingestion-run-request-bounds.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/plans/2026-08-04-ingestion-run-request-bounds-implementation-plan.md`

Internal slices:

- Failing direct-write request-boundary characterization.
- Named forward constraints and owning changeset mappings.
- Ingestion lifecycle parity and complete backend verification.

Prerequisites:

- `page_size` and `pages_requested` remain nullable and must be positive when
  present.
- No active row owns the import-run schema, ingestion migrations, or affected
  ingestion tests.
- No current data requires a non-null request value below one.

Verification:

- focused ingestion-run direct-write suite
- import-run, scheduled-cursor, reconciliation, source-health, and CJ run-health
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects zero and negative import-run request
metadata, null and positive values remain accepted, ingestion behavior is
unchanged, and all backend gates pass.

## Ready Work

### 23. Taxon Attribute Storage Bounds

Status: ready
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
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
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

### 25. Product Attribute Claim Companion Storage Integrity

Status: ready
Lane: Specification claim storage integrity
Plan: `docs/superpowers/plans/2026-08-05-product-attribute-claim-companion-storage-integrity-implementation-plan.md`
Batch outcome: PostgreSQL preserves the complete, ordered numeric companion
representation already required by ProductAttributeClaim changesets.
Next action: add failing direct-write tests for orphaned numeric companions,
missing unit/base companions, and inverted normalized ranges before adding the
named forward checks.
Owned paths:

- `priv/repo/migrations/20260805020000_enforce_product_attribute_claim_companion_integrity.exs`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `test/product_compare/repo/product_attribute_claim_companion_storage_integrity_test.exs`
- affected product-attribute-claim changeset, database-constraint, import, and
  read tests
- `docs/work/product-attribute-claim-companion-storage-integrity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/plans/2026-08-05-product-attribute-claim-companion-storage-integrity-implementation-plan.md`

Internal slices:

- Failing direct-write companion and range characterization with valid controls.
- Named forward constraints and owning changeset mappings.
- Claim lifecycle parity and complete backend verification.

Prerequisites:

- Numeric claims retain their existing unit, normalized base, optional range,
  and minimum-not-above-maximum rules.
- No active row owns ProductAttributeClaim storage or its affected tests.
- No current claim violates the established companion relationships.

Verification:

- focused direct-write companion suite
- ProductAttributeClaim changeset and database-constraint suites
- affected claim import and read suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects incomplete or inverted numeric claim
representations, valid typed claims remain accepted, claim behavior is
unchanged, and all backend gates pass.

### 26. Specification Definition Creation Validity

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
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
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

### 27. Ingestion Run Terminal Timestamp Integrity

Status: ready
Lane: Ingestion lifecycle storage integrity
Plan: `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`
Batch outcome: PostgreSQL requires completion timestamps for terminal ingestion
runs while preserving unfinished running rows.
Next action: add failing direct-write tests for succeeded and failed runs with
null `finished_at` values before adding the named forward check.
Owned paths:

- `priv/repo/migrations/20260805040000_enforce_ingestion_run_terminal_timestamp_integrity.exs`
- `lib/product_compare_schemas/ingestion/import_run.ex`
- `test/product_compare/repo/ingestion_run_terminal_timestamp_integrity_test.exs`
- affected ingestion readiness, health, scheduling, reconciliation, and source
  health tests
- `docs/work/ingestion-run-terminal-timestamp-integrity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/plans/2026-08-05-ingestion-run-terminal-timestamp-integrity-implementation-plan.md`

Internal slices:

- Failing terminal timestamp characterization with running/terminal controls.
- One named forward check and its owning changeset mapping.
- Truthful readiness fixtures, lifecycle parity, and complete verification.

Prerequisites:

- `running` rows may keep `finished_at` null; `succeeded` and `failed` rows may
  not.
- No active row owns ImportRun storage when this row is claimed.
- No current terminal run lacks a completion timestamp.

Verification:

- focused ingestion terminal-timestamp direct-write suite
- CJ readiness, run-health, scheduling, reconciliation, and source-health suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects terminal runs without `finished_at`, valid
running and completed runs remain accepted, ingestion behavior is unchanged,
and all backend gates pass.

### 28. User Email Shape Storage Integrity

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
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
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

### 29. Commerce Identifier Storage Integrity

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
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
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

## Needs Decision Work

None.

## Blocked Work

None.
