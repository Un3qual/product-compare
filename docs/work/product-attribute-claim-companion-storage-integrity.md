# Product Attribute Claim Companion Storage Integrity

## Snapshot

- Status: ready
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-product-attribute-claim-companion-storage-integrity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-product-attribute-claim-companion-storage-integrity-design.md`
- Last verified: 2026-08-05 against the owning claim schema, migrations, live
  row preflight, and 11 focused claim tests.

## Target Outcome

PostgreSQL preserves the complete, ordered numeric companion representation
already required by ProductAttributeClaim changesets, including for direct
writes.

## Ready Evidence

- Numeric companion fields are rejected without `value_num`; numeric values
  require `unit_id` and `value_num_base`; optional normalized minimum and
  maximum values must be ordered.
- PostgreSQL currently enforces confidence and exactly-one-typed-value rules
  but none of those three companion relationships.
- The live preflight found zero orphan companions, missing required companions,
  or inverted normalized ranges.
- ProductAttributeClaim changeset and database-constraint baselines passed 11
  tests with no failures.

## Boundaries

- Preserve typed-value, confidence, fingerprint, import, unit-conversion,
  moderation, and read behavior.
- Keep range endpoints independently nullable and add no sign, precision,
  containment, conversion, or generic numeric policy.
- Stop if preflight finds invalid evidence; do not rewrite or delete it.

## Internal Slices

1. Failing direct-write companion/range characterization and valid controls.
2. Three named forward checks and owning changeset mappings.
3. Claim lifecycle parity and complete backend verification.

## Verification

- focused direct-write companion storage suite
- ProductAttributeClaim changeset and database-constraint suites
- affected import, catalog projection, recommendation, and correction suites
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate` and `git diff --check`

## Blocker Rule

If preflight finds a violating claim, report its ID and companion fields and
stop. Do not coerce, delete, or otherwise rewrite persisted claim evidence.
