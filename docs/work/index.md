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

### 21. Credential Artifact Storage Constraints

Status: ready
Lane: Account credential storage integrity
Plan: `docs/superpowers/plans/2026-08-04-credential-artifact-storage-constraints-implementation-plan.md`
Batch outcome: PostgreSQL retains the fixed digest and display-metadata bounds
of account credential artifacts even when a write bypasses application
changesets.
Next action: add failing direct-write tests for user-token digest bytes and
API-token prefix and label lengths before adding the named forward constraints.
Owned paths:

- `priv/repo/migrations/20260804220000_enforce_credential_artifact_storage_constraints.exs`
- `lib/product_compare_schemas/accounts/api_token.ex`
- `lib/product_compare_schemas/accounts/user_session_token.ex`
- `test/product_compare/repo/credential_artifact_storage_constraints_test.exs`
- affected account auth, API-token, session-token schema, GraphQL auth/token,
  node-query, and seed tests
- `docs/work/credential-artifact-storage-constraints.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/plans/2026-08-04-credential-artifact-storage-constraints-implementation-plan.md`

Internal slices:

- Failing direct-write digest and metadata-boundary characterization.
- Named forward constraints and owning changeset mappings.
- Account lifecycle parity and complete backend verification.

Prerequisites:

- Session, confirmation, and reset tokens continue to use 32-byte SHA-256
  digests.
- API-token prefixes and optional labels retain their current changeset bounds.
- No active row owns account schemas, credential migrations, or account tests.

Verification:

- focused credential-artifact direct-write suite
- affected account auth, API-token, session-token schema, GraphQL auth/token,
  node-query, and seed suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects malformed credential digests and overlong
API-token metadata, valid boundary values remain accepted, account behavior is
unchanged, and all backend gates pass.

### 22. Ingestion Run Request Bounds

Status: ready
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
Batch outcome: PostgreSQL retains established character bounds for authored
threads, posts, reviews, and reports even when writes bypass changesets.
Next action: add failing direct-write tests for every one-character-outside
community text boundary before adding the six named forward checks.
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

- Failing direct-write authored-text boundary characterization.
- Six named forward checks and owning changeset mappings.
- Community lifecycle parity and complete backend verification.

Prerequisites:

- Current changeset length limits, nullability, and required-field behavior
  remain unchanged.
- The existing report-reason `varchar(500)` upper bound remains intact.
- No active row owns community schemas, migrations, or affected tests.
- No current community row violates one of the six missing boundaries.

Verification:

- focused community-authored-text direct-write suite
- content lifecycle, thread-post validation, community trust, GraphQL
  community content, node-query, Dataloader batching, and deterministic seed
  suites
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL rejects out-of-bounds community-authored text, all
valid boundaries remain accepted, community behavior is unchanged, and all
backend gates pass.

## Needs Decision Work

None.

## Blocked Work

None.
