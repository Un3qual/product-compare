# Product Attribute Claim Scope Storage Integrity Design

## Status

Ready. Live preflight and focused baseline passed on 2026-08-06.

## Context

`product_attribute_claims` owns the product and attribute scope of each claim.
Two dependent tables repeat that scope beside `claim_id`:

- `product_attribute_current` identifies the selected claim for one
  `(product_id, attribute_id)` pair; and
- `specification_corrections` identifies the product and attribute whose claim
  a user is correcting.

The application already treats those three IDs as one relationship.
`ProductCompare.Specs.Claims.Moderation.lock_selected_claim/3` accepts a
current selection only when the loaded claim has the requested `product_id`
and `attribute_id`; otherwise it returns
`:claim_product_attribute_mismatch`. Imported selections copy both IDs from
the claim. Correction creation constructs the new claim and correction from
the same two IDs, and accepted corrections copy that correction scope into the
current-selection row.

The original migrations give each dependent column an independent foreign
key. PostgreSQL therefore confirms that all three referenced rows exist but
does not confirm that `claim_id` belongs to the stored product and attribute.
A direct SQL, bulk, or future bypass write can cross-wire either dependent row
to a valid claim from another product or attribute.

`current_claim_selection_test.exs` explicitly characterizes the application
boundary: the context rejects mismatched scope while the owning changeset
performs no repository query. Database referential integrity is therefore the
appropriate bypass-write boundary.

## Approaches Considered

### 1. One composite claim-scope target and two composite foreign keys

Create a unique target on
`product_attribute_claims(product_id, attribute_id, id)`. Replace each
dependent table's single-column `claim_id` foreign key with a composite foreign
key from `(product_id, attribute_id, claim_id)` to that target.

This is the selected approach. It expresses the existing rule as ordinary
referential integrity, covers the only two persisted claim-scope dependents,
and preserves the current `ON DELETE CASCADE` action without a trigger or
application query.

### 2. Add cross-table validation triggers

Triggers could load the claim and compare its scope. They would duplicate
built-in foreign-key behavior, add procedural failure paths, and require
separate decisions about accepted/superseded claim status. They are not
justified for this relational invariant.

### 3. Validate through each changeset

Repository queries inside the changesets would race with a later claim update
and would still be bypassed by direct SQL. Existing tests deliberately keep the
current-selection changeset query-free.

### 4. Split current selections and corrections into separate batches

Both tables repeat the same claim-owned scope and require the same composite
target. Splitting them would produce two migration-sized fragments rather than
one independently reviewable invariant.

## Design

Create
`20260805060000_enforce_product_attribute_claim_scope_integrity.exs` with an
explicit reversible `up/0` and `down/0`.

The forward migration must:

1. create unique index
   `product_attribute_claims_product_attribute_id_uq` on
   `(product_id, attribute_id, id)`;
2. replace `product_attribute_current_claim_id_fkey` with
   `product_attribute_current_claim_scope_fkey`; and
3. replace `specification_corrections_claim_id_fkey` with
   `specification_corrections_claim_scope_fkey`.

The two new constraints are:

```sql
ALTER TABLE product_attribute_current
DROP CONSTRAINT product_attribute_current_claim_id_fkey,
ADD CONSTRAINT product_attribute_current_claim_scope_fkey
FOREIGN KEY (product_id, attribute_id, claim_id)
REFERENCES product_attribute_claims(product_id, attribute_id, id)
ON DELETE CASCADE;

ALTER TABLE specification_corrections
DROP CONSTRAINT specification_corrections_claim_id_fkey,
ADD CONSTRAINT specification_corrections_claim_scope_fkey
FOREIGN KEY (product_id, attribute_id, claim_id)
REFERENCES product_attribute_claims(product_id, attribute_id, id)
ON DELETE CASCADE;
```

The reverse migration must drop both composite foreign keys, recreate the
original single-column `claim_id` foreign keys with `ON DELETE CASCADE`, and
only then drop `product_attribute_claims_product_attribute_id_uq`.

Map each new named constraint to `:claim_id` in its owning schema changeset.
Keep the independent product and attribute foreign keys unchanged.

## Exact Read-Only Preflight

The live test-database query returned `violating_rows = 0` for both dependent
tables on 2026-08-06:

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

Confirm the live constraint names and deletion actions before replacing them:

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

Both definitions must be single-column `claim_id` foreign keys to
`product_attribute_claims(id)` with `ON DELETE CASCADE`.

## Test Design

The focused repository suite uses valid fixture-backed rows and direct SQL
updates so unrelated required fields and foreign keys remain truthful. It must
cover eight boundaries:

1. current selection rejects a product mismatch under
   `product_attribute_current_claim_scope_fkey`;
2. current selection rejects an attribute mismatch under the same name;
3. specification correction rejects a product mismatch under
   `specification_corrections_claim_scope_fkey`;
4. specification correction rejects an attribute mismatch under the same
   name;
5. an exact-scope current selection remains accepted;
6. an exact-scope correction remains accepted;
7. deleting a claim still cascades its current-selection row; and
8. deleting a claim still cascades its correction row.

Before migration, only the four mismatch assertions are expected to be RED;
the accepted-scope and deletion controls must already pass. After migration,
all eight must be GREEN and the exact PostgreSQL error code must be
`:foreign_key_violation`.

## Boundaries

- Preserve `ON DELETE CASCADE` for both claim relationships.
- Preserve the independent product and attribute foreign keys, current-row
  uniqueness, correction uniqueness, and all existing transaction locking.
- Do not add changeset repository queries or a trigger.
- Do not enforce claim status in PostgreSQL. Accepted, proposed, rejected, and
  superseded transitions remain application lifecycle behavior.
- Do not change claim creation, correction moderation, ingestion
  auto-acceptance, stored IDs, or deletion policy.
- Add no generic composite-foreign-key abstraction.
- Use no regex or text normalization rule.
- Never rewrite, relink, or delete durable rows to make the migration pass.

## Failure Handling

Stop and report evidence rather than implementing if:

- either preflight count is nonzero;
- the live original foreign-key name or `ON DELETE CASCADE` action differs from
  the static migration;
- the focused application baseline is already failing; or
- another active owner overlaps either schema or the proposed migration path.

Do not repair mismatched rows, weaken the composite relationship, change the
deletion action, or broaden the batch into claim-status enforcement.

## Verification

- Run the exact live preflight and schema-definition query.
- Record a fresh focused application baseline before writing tests.
- Demonstrate RED for both mismatch dimensions on both dependent tables.
- Apply the migration and demonstrate GREEN, including both cascade controls.
- Run claim selection, correction, concurrency, read, ingestion, seed, catalog,
  recommendation, snapshot, SEO, and GraphQL consumer suites.
- Run complete backend tests, type checks, quality, formatting, queue
  validation, and diff checks before coordinator closeout.
