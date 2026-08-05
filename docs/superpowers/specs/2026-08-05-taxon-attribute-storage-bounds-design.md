# Taxon Attribute Storage Bounds Design

## Problem

`ProductCompareSchemas.Specs.TaxonAttribute.changeset/2` rejects negative
`sort_order` and `min_rep_to_edit` values, but PostgreSQL currently enforces
only non-null defaults for those columns. A direct write can therefore persist
values that the owning application boundary considers invalid.

This is observable product data, not inert metadata. `sort_order` controls the
primary ordering of current product attributes, and `min_rep_to_edit` is the
stored reputation threshold for editing a taxon attribute.

## Decision

Add two named PostgreSQL check constraints to `taxon_attributes`:

- `taxon_attributes_sort_order_non_negative`
- `taxon_attributes_min_rep_to_edit_non_negative`

Map both names in `TaxonAttribute.changeset/2` so constraint failures remain
owned by the schema boundary. Preserve zero as the default and valid lower
boundary. Do not add upper bounds or change read ordering, GraphQL projection,
or reputation policy.

## Components And Data Flow

- A focused repository test inserts valid taxon and attribute owners, then uses
  direct SQL to prove negative values are rejected and zero and positive values
  remain accepted.
- One forward migration preflights existing rows and adds the two checks. It
  raises instead of rewriting data if a negative value exists.
- `TaxonAttribute.changeset/2` maps the named constraints after its existing
  application validations.
- Existing read-helper and catalog GraphQL suites prove the stored ordering and
  projection contracts remain unchanged.

## Alternatives Rejected

- Rely on changesets alone: bulk, migration, administrative, and direct SQL
  writes can bypass them.
- Normalize negative rows to zero during migration: silently rewriting stored
  taxonomy policy would hide invalid state.
- Add upper bounds: the codebase establishes only non-negative lower bounds.
- Split the fields into separate batches: they are adjacent integer-domain
  invariants on one table with one migration and one review boundary.

## Boundaries

- Do not change taxonomy, specification, GraphQL, or frontend behavior.
- Do not change defaults, nullability, types, ordering semantics, or reputation
  authorization policy.
- Do not add generic constraint helpers or a broader storage-policy framework.
- Stop if existing data violates either invariant.

## Verification

- Focused direct-write constraint coverage.
- Existing TaxonAttribute changeset, current-attribute read, and catalog GraphQL
  suites.
- Complete backend tests, type checks, quality, formatting, queue validation,
  and diff hygiene.
