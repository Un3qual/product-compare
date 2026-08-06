# Product Attribute Claim Companion Storage Integrity Design

## Context

`ProductAttributeClaim.changeset/2` already defines one normalized numeric
representation: numeric companion fields cannot exist without `value_num`, a
numeric value requires both `unit_id` and `value_num_base`, and an optional
normalized minimum cannot exceed its maximum. PostgreSQL currently enforces
confidence and exactly-one-typed-value rules but not these companion
relationships, so direct writes can persist claims that normal application and
import paths reject. The 2026-08-05 live preflight found zero violating rows,
and the focused claim baseline passed 11 tests.

## Decision

Add one forward migration with three named checks matching the existing
changeset branches exactly:

- `product_attribute_claims_numeric_companions_require_value`
- `product_attribute_claims_numeric_value_requires_companions`
- `product_attribute_claims_numeric_range_ordered`

Map each name through `ProductAttributeClaim.changeset/2` and prove the storage
boundary with direct writes before running existing claim changeset, database,
import, and read tests.

## Alternatives Rejected

- A single opaque check would make constraint failures harder to map to the
  field that violates the established contract.
- Database triggers or a generic numeric-policy module add ceremony without
  improving these declarative row-local relationships.
- New range completeness, positivity, precision, or unit-conversion rules are
  not established application policy and remain out of scope.

## Boundaries

- Preserve exactly-one-typed-value, confidence, fingerprint, unit conversion,
  import, moderation, and claim-read behavior.
- Keep normalized minimum and maximum independently nullable.
- Add no numeric sign, precision, range-containment, or conversion policy.
- Stop if the preflight finds an invalid row; do not rewrite claim evidence.
- Use a forward migration and never reset the development database.

## Verification

The direct-write test first fails because PostgreSQL accepts each invalid
shape, then passes against the exact named checks. Existing claim changeset and
database-constraint tests plus affected import/read suites protect application
parity. Complete backend tests, types, quality, formatting, queue validation,
and diff checks close the batch.
