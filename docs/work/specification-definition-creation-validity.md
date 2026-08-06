# Specification Definition Creation Validity

## Snapshot

- Status: active
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-specification-definition-creation-validity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-specification-definition-creation-validity-design.md`
- Last verified: 2026-08-05 against Attribute and Unit schemas, definition
  immutability triggers, live row preflight, and 14 focused tests.

## Target Outcome

PostgreSQL requires valid enum ownership and nonzero conversion multipliers
when specification definitions are first inserted.

## Ready Evidence

- `Attribute.changeset/2` requires enum attributes to reference an enum set and
  forbids enum sets on other data types.
- `Unit.changeset/2` rejects a zero `multiplier_to_base`.
- Existing PostgreSQL triggers freeze those semantics only on update; no row
  check rejects an invalid initial insert.
- Live preflight found zero invalid attributes or units.
- Definition-semantics and unit-conversion baselines passed 14 tests.

## Boundaries

- Preserve native enums, foreign keys, uniqueness, update triggers, unit
  conversion, GraphQL, ingestion, and catalog behavior.
- Add only enum-set consistency and a nonzero multiplier; no dimension, offset,
  range, code-shape, or generic definition policy.
- Stop if preflight finds an invalid definition; do not rewrite it.

## Internal Slices

1. Failing direct-write Attribute/Unit characterization and valid controls.
2. Two named forward checks and owning changeset mappings.
3. Definition immutability and unit-conversion parity plus complete gates.

## Verification

- focused direct-write specification-definition suite
- definition-semantics and unit-conversion suites
- affected claim, ingestion/enrichment, catalog, and recommendation suites
- `mix test`, `mix typecheck`, `mix quality`, and
  `mix format --check-formatted`
- `mix work_queue.validate` and `git diff --check`

## Blocker Rule

If preflight finds an invalid Attribute or Unit, report its table, ID, and
semantic fields and stop. Do not coerce, delete, or otherwise repair the row.
