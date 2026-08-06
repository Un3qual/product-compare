# Specification Definition Creation Validity

## Snapshot

- Status: pending coordinator closeout
- Owner: Codex `/root` in the detached workspace at
  `/Users/admin/.codex/worktrees/5ad5/backend`
- Priority: P1
- Plan:
  `docs/superpowers/plans/2026-08-05-specification-definition-creation-validity-implementation-plan.md`
- Design:
  `docs/superpowers/specs/2026-08-05-specification-definition-creation-validity-design.md`
- Last verified: 2026-08-06 after the reviewed storage implementation, with
  all downstream lifecycle suites and repository gates green.

## Batch Outcome

PostgreSQL now rejects newly inserted enum Attributes without an enum set,
non-enum Attributes with an enum set, and Units with a zero conversion
multiplier while preserving valid definitions and existing update immutability.

## Observed Evidence

- The reviewed implementation adds the named PostgreSQL checks
  `attributes_enum_set_consistency` and
  `units_multiplier_to_base_nonzero`; existing definition-immutability
  triggers remain unchanged.
- Fresh downstream lifecycle verification passed 93 tests with 0 failures:
  definition semantics, unit conversion, product-attribute claim changeset and
  database-constraint coverage, ingestion/enrichment (including concurrency),
  recommendations, catalog GraphQL, recommendations GraphQL, and
  specification-corrections GraphQL.
- Fresh full backend verification passed 1,252 tests with 0 failures. This
  includes the direct-write creation-validity regression suite.
- Fresh gates passed: `mix typecheck`, `mix quality` (Credo reported no issues;
  ExDNA stayed within its 3/3 clone budget; Dialyzer passed),
  `mix format --check-formatted`, `mix work_queue.validate` (4 ready rows), and
  `git diff --check`.

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

## Closeout Status

All worker-owned verification is complete. The coordinator must update the
shared dispatch queue, catalog, history, and implementation plan while
preserving the ready-row floor.

## Blocker Rule

If preflight finds an invalid Attribute or Unit, report its table, ID, and
semantic fields and stop. Do not coerce, delete, or otherwise repair the row.
