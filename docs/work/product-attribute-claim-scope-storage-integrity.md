# Product Attribute Claim Scope Storage Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-06-product-attribute-claim-scope-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-06-product-attribute-claim-scope-storage-integrity-design.md`
- Last verified: 2026-08-06 against the current application claim-selection,
  correction, schema, migration, and test sources plus the live PostgreSQL test
  database and focused 15-test application baseline.

## Candidate Outcome

PostgreSQL requires every `product_attribute_current` and
`specification_corrections` row to carry the same `product_id` and
`attribute_id` as its referenced claim, even when a write bypasses the owning
application contexts and changesets.

## Ready Evidence

- `Claims.Moderation.lock_selected_claim/3` loads and locks the claim, accepts
  only a matching product-and-attribute scope, and returns
  `:claim_product_attribute_mismatch` otherwise.
- Import auto-acceptance copies `claim.product_id` and `claim.attribute_id`
  into `ProductAttributeCurrent`.
- Correction creation constructs its claim and correction from the same scope;
  correction acceptance copies the correction scope into the current row.
- `current_claim_selection_test.exs` proves application mismatch rejection and
  deliberately proves that `ProductAttributeCurrent.changeset/2` performs no
  claim-scope repository query.
- The original migrations define independent product, attribute, and claim
  foreign keys for both dependents. They do not tie a `claim_id` to the stored
  product and attribute.
- Static production-callsite review found no path that changes a claim's
  `product_id` or `attribute_id` after insertion.
- `product_attribute_current` and `specification_corrections` are the only
  persisted dependents that repeat both claim-owned scope IDs. Grouping them
  avoids two migration-sized micro-batches.
- The proposed schemas, Specs tests, and migration path do not overlap ready
  ThreadPost or ImportRun work.
- Live preflight returned zero mismatched rows for both
  `product_attribute_current` and `specification_corrections`.
- The live original foreign keys are exactly the expected single-column
  `claim_id` references with `ON DELETE CASCADE`.
- `mix test test/product_compare/specs/current_claim_selection_test.exs
  test/product_compare/specs/corrections_test.exs` passed 15 tests with no
  failures.

## Live Preflight

Run after the shared test database is free. Both counts must be zero:

```sql
SELECT 'product_attribute_current' AS dependent_table, count(*) AS violating_rows
FROM product_attribute_current AS current_row
LEFT JOIN product_attribute_claims AS claim ON claim.id = current_row.claim_id
WHERE claim.id IS NULL
   OR current_row.product_id IS DISTINCT FROM claim.product_id
   OR current_row.attribute_id IS DISTINCT FROM claim.attribute_id

UNION ALL

SELECT 'specification_corrections' AS dependent_table, count(*) AS violating_rows
FROM specification_corrections AS correction
LEFT JOIN product_attribute_claims AS claim ON claim.id = correction.claim_id
WHERE claim.id IS NULL
   OR correction.product_id IS DISTINCT FROM claim.product_id
   OR correction.attribute_id IS DISTINCT FROM claim.attribute_id;
```

Confirm the live original definitions:

```sql
SELECT
  conrelid::regclass AS table_name,
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname IN (
  'product_attribute_current_claim_id_fkey',
  'specification_corrections_claim_id_fkey'
)
ORDER BY conrelid::regclass::text;
```

Both must be single-column `claim_id` foreign keys with
`ON DELETE CASCADE`.

Fresh baseline:

```sh
mix test test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs
```

Observed result: 15 tests, 0 failures.

## Proposed Storage Boundary

- Unique target `product_attribute_claims_product_attribute_id_uq` on
  `(product_id, attribute_id, id)`.
- Composite foreign key `product_attribute_current_claim_scope_fkey` from
  `(product_id, attribute_id, claim_id)` to that target.
- Composite foreign key `specification_corrections_claim_scope_fkey` from
  `(product_id, attribute_id, claim_id)` to that target.
- Both composite foreign keys retain `ON DELETE CASCADE` and replace the
  original single-column claim foreign keys.
- The owning changesets map their named composite constraint to `:claim_id`.
- Explicit `down/0` restores both original single-column claim foreign keys
  with `ON DELETE CASCADE` before dropping the shared unique target.

## Boundaries

- Preserve independent product and attribute foreign keys, row uniqueness,
  correction uniqueness, and application locking.
- Preserve claim-deletion cascades for both dependent tables.
- Keep changesets query-free for cross-table scope; PostgreSQL owns bypass
  enforcement.
- Keep claim-status transitions application-owned. Do not introduce an
  accepted-status trigger or database policy.
- Add no generic abstraction, data cleanup, regex, Unicode rule, identity
  normalization, or deletion-policy change.
- Do not edit the live queue, candidate catalog, or work-index history from an
  implementation task.

## Internal Slices

1. Exact live preflight and focused baseline, followed by eight direct-write
   tests covering both mismatch dimensions, exact-scope acceptance, and
   claim-deletion cascades for both dependents.
2. Reversible shared target and composite foreign keys plus both owning
   changeset mappings.
3. Claim lifecycle, ingestion, seed, read-consumer, and complete repository
   verification followed by coordinator-only dispatch closeout.

## Verification

- Exact read-only data and original-constraint preflights
- `mix test test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs`
- `mix test test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`
- `MIX_ENV=test mix ecto.migrate`
- `mix test test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs`
- `mix test test/product_compare/specs/concurrency_test.exs test/product_compare/specs/read_helpers_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/repo/seeds_test.exs`
- `mix test test/product_compare/catalog/filter_metadata_test.exs test/product_compare/catalog/filtering_regression_test.exs test/product_compare/recommendations_test.exs test/product_compare/comparison_snapshots_test.exs test/product_compare/seo_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate` and `git diff --check`

## Blocker Rule

Do not promote or implement this candidate if either mismatch count is
nonzero, either live original foreign-key name or deletion action differs from
the static migration, the 15-test focused baseline fails, or another active
row owns an overlapping path. Report exact evidence and stop. Do not rewrite,
relink, or delete durable records; do not weaken the composite foreign keys;
and do not broaden the candidate into claim-status or deletion-policy work.

The coordinator promoted this candidate only after the clean live preflight and
focused baseline, while preserving the three-row live ready floor.
