# Specification Definition Creation Validity Design

## Context

`Attribute.changeset/2` requires enum attributes to reference an enum set and
forbids enum sets on every other data type. `Unit.changeset/2` rejects a zero
`multiplier_to_base`. Existing PostgreSQL triggers make these definition
semantics immutable after insertion, but direct inserts can create invalid
definitions that those triggers then preserve. The 2026-08-05 live preflight
found zero invalid attributes or units, and 14 focused definition/unit tests
passed.

## Decision

Add one forward migration with two named row-local checks:

- `attributes_enum_set_consistency`
- `units_multiplier_to_base_nonzero`

Map those names in the owning changesets. Characterize invalid and accepted
direct inserts before adding the checks, then prove existing immutability and
unit-conversion behavior remains unchanged.

## Alternatives Rejected

- Expanding the existing update triggers to special-case inserts is less clear
  than declarative checks and couples unrelated tables to procedural code.
- New dimension, offset, code-shape, or conversion-range policy is not required
  by the existing changesets and remains out of scope.
- Splitting Attribute and Unit into helper-sized batches would fragment the one
  acceptance boundary: stored specification definitions must be valid before
  their established immutability triggers preserve them.

## Boundaries

- Preserve native enum storage, foreign keys, uniqueness, definition
  immutability triggers, unit conversion, GraphQL, and catalog behavior.
- Require only enum-set consistency and a nonzero multiplier.
- Stop if preflight finds invalid definitions; do not repair durable data.
- Use a forward migration and never reset the development database.

## Verification

Direct-write tests first fail because PostgreSQL accepts invalid inserts and
then pass against exact named checks. Definition semantics, unit conversion,
claim, ingestion, and catalog suites protect downstream parity. Complete
backend tests, types, quality, formatting, queue validation, and diff checks
close the batch.
