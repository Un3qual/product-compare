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

### Core Identifier And Reference Integrity

Status: ready
Lane: Core identifier and reference integrity
Plan: `docs/superpowers/plans/2026-08-09-core-identifier-and-reference-integrity-implementation-plan.md`
Batch outcome: PostgreSQL and Ecto preserve exact canonical identifiers and
numeric claim reference facts as one consolidated core persisted-integrity
outcome.
Next action: run the exact identifier, numeric-companion, numeric-range, and
Unit-reference preflights, then add the two failing direct-write suites before
changing production schemas or migrations.
Owned paths:

- `priv/repo/migrations/20260809130100_enforce_core_identifier_storage_integrity.exs`
- `priv/repo/migrations/20260809130200_enforce_product_attribute_claim_reference_integrity.exs`
- `lib/product_compare_schemas/catalog/product.ex`
- `lib/product_compare_schemas/catalog/product_slug_alias.ex`
- `lib/product_compare_schemas/catalog/comparison_snapshot.ex`
- `lib/product_compare_schemas/pricing/merchant.ex`
- `lib/product_compare_schemas/affiliate/affiliate_network.ex`
- `lib/product_compare_schemas/taxonomy/taxon.ex`
- `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- `lib/product_compare/comparison_snapshots/lifecycle.ex`
- `test/product_compare/repo/core_identifier_storage_integrity_test.exs`
- `test/product_compare/repo/product_attribute_claim_reference_integrity_test.exs`
- affected regression tests named by the linked plan
- `docs/work/core-identifier-and-reference-integrity.md`
- `docs/work/index.md`
- `docs/plans/INDEX.md`
- `docs/plans/2026-07-31-work-index-history.md`
- `docs/superpowers/specs/2026-08-05-commerce-identifier-storage-integrity-design.md`
- `docs/superpowers/plans/2026-08-05-commerce-identifier-storage-integrity-implementation-plan.md`
- `docs/work/commerce-identifier-storage-integrity.md`

Internal slices:

- Exact product, alias, reservation, merchant, affiliate-network, taxonomy SEO,
  and comparison-token identifier boundaries.
- Numeric claim companion and range constraints plus referenced-Unit retention.
- Consolidated dispatch, regression verification, history, and superseded-draft
  cleanup.

Prerequisites:

- All four preflight families return zero invalid rows.
- The Unit foreign key, product namespace triggers, and comparison token check
  retain their expected current definitions.
- No active row owns any listed implementation path.

Verification:

- focused identifier and numeric-reference direct-write suites
- affected product, pricing, affiliate, taxonomy, comparison, specification,
  ingestion, catalog, recommendation, SEO, and GraphQL suites named by the plan
- full backend tests, type checks, quality, and formatting
- `mix work_queue.validate`
- `git diff --check`

Exit condition: PostgreSQL and Ecto agree on every selected exact identifier,
numeric claims retain consistent companions and referenced Units, all focused
and repository gates pass, and one completion record closes the batch without
promoting internal slices.

## Ready Floor Exception

Reason: Current validation supports one substantial consolidated core-integrity
outcome and no independent reserve row; discussion and provider/operator work
remain explicitly deferred.
Rejected split: Product, commerce, taxonomy, snapshot, and numeric-reference
migrations and tests are internal slices of the combined outcome, not reserve
rows or separate batches.
Replenishment action: Audit current core product behavior and architecture gaps
for the next independently shippable outcome while this batch executes.

## Needs Decision Work

None.

## Blocked Work

None.
