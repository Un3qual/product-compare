# Specification Definition Creation Validity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL reject invalid Attribute and Unit definitions at
insertion before existing immutability triggers preserve their semantics.

**Architecture:** Freeze enum-set consistency and nonzero unit multipliers with
direct-write tests, add one named row-local check per table, and map each check
through its owning changeset. Keep all existing update triggers and downstream
behavior unchanged.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve native enums, foreign keys, uniqueness, definition immutability,
  unit conversion, GraphQL, ingestion, and catalog behavior.
- Require only enum-set consistency and a nonzero conversion multiplier.
- Add no dimension, offset, code-shape, range, or generic definition policy.
- Stop rather than rewriting definitions if preflight finds invalid data.
- Use a forward migration and never reset the development database.

---

### Task 1: Characterize Invalid Definition Inserts

**Files:**

- Create: `test/product_compare/repo/specification_definition_creation_validity_test.exs`
- Read: `lib/product_compare_schemas/specs/attribute.ex`
- Read: `lib/product_compare_schemas/specs/unit.ex`
- Read: `priv/repo/migrations/20260730150000_enforce_spec_definition_semantics.exs`

**Interfaces:**

- Consumes: existing `attributes`, `enum_sets`, `dimensions`, and `units`
  tables.
- Produces: direct-write regressions for two exact named checks.

- [x] **Step 1: Add failing Attribute direct-write cases**

  Insert minimum valid dimension and enum-set fixtures through the Repo. Assert
  that an enum Attribute without `enum_set_id`, and a non-enum Attribute with
  `enum_set_id`, fail under `attributes_enum_set_consistency`.

- [x] **Step 2: Add the failing Unit case and valid controls**

  Assert that a Unit with `multiplier_to_base = 0` fails under
  `units_multiplier_to_base_nonzero`. Add distinct accepted controls for an
  enum Attribute with an enum set, a non-enum Attribute without one, and Units
  with representative positive and negative nonzero multipliers.

- [x] **Step 3: Verify RED**

  ```bash
  mix test test/product_compare/repo/specification_definition_creation_validity_test.exs
  ```

  Expected before the migration: PostgreSQL accepts the invalid inserts, so
  the exact constraint-name assertions fail.

### Task 2: Add and Map Creation-Time Checks

**Files:**

- Create: `priv/repo/migrations/20260805030000_enforce_specification_definition_creation_validity.exs`
- Modify: `lib/product_compare_schemas/specs/attribute.ex`
- Modify: `lib/product_compare_schemas/specs/unit.ex`
- Test: `test/product_compare/repo/specification_definition_creation_validity_test.exs`
- Verify: `test/product_compare/specs/definition_semantics_test.exs`
- Verify: `test/product_compare/specs/unit_conversion_test.exs`

**Interfaces:**

- Consumes: the creation boundary frozen by Task 1.
- Produces: two reversible checks and owning schema mappings.

- [x] **Step 1: Run the read-only preflight**

  Run this exact query. Expected: zero rows. Stop and report exact IDs/values
  if it returns data; do not repair definitions.

  ```sql
  SELECT 'attributes' AS table_name, id,
         data_type::text AS kind, enum_set_id::text AS detail
  FROM attributes
  WHERE (data_type = 'enum' AND enum_set_id IS NULL)
     OR (data_type <> 'enum' AND enum_set_id IS NOT NULL)
  UNION ALL
  SELECT 'units', id, 'multiplier_to_base', multiplier_to_base::text
  FROM units
  WHERE multiplier_to_base = 0;
  ```

- [x] **Step 2: Add the reversible forward migration**

  Create these exact checks:

  ```sql
  (data_type = 'enum' AND enum_set_id IS NOT NULL) OR
    (data_type <> 'enum' AND enum_set_id IS NULL)

  multiplier_to_base <> 0
  ```

  Name them `attributes_enum_set_consistency` and
  `units_multiplier_to_base_nonzero`. `down/0` removes only those names and
  leaves existing semantics triggers intact.

- [x] **Step 3: Map failures without changing validation behavior**

  Add `check_constraint/3` for `attributes_enum_set_consistency` on
  `:enum_set_id` after the current consistency validation. Add the nonzero
  constraint mapping on `:multiplier_to_base` after the current
  `validate_change/3`. Preserve all existing messages and immutable-semantics
  mappings.

- [x] **Step 4: Apply and verify GREEN**

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/specification_definition_creation_validity_test.exs test/product_compare/specs/definition_semantics_test.exs test/product_compare/specs/unit_conversion_test.exs
  ```

  Expected: invalid direct writes return exact named checks, valid controls
  pass, and the existing 14-test definition/unit baseline remains green.

- [x] **Step 5: Commit the storage milestone**

  Commit message: `fix: enforce valid specification definitions`

### Task 3: Verify Definition Lifecycle Parity and Close

**Files:**

- Modify: `docs/work/specification-definition-creation-validity.md`
- Modify at coordinator closeout only: `docs/work/index.md`,
  `docs/plans/INDEX.md`, `docs/plans/2026-07-31-work-index-history.md`, and this
  implementation plan.

**Interfaces:**

- Consumes: the two checks and passing focused suites.
- Produces: downstream verification and truthful dispatch closeout evidence.

- [x] **Step 1: Run affected downstream suites**

  Run:

  ```bash
  mix test test/product_compare/specs/definition_semantics_test.exs test/product_compare/specs/unit_conversion_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/product_attribute_claim_db_constraint_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/ingestion/enrichment_concurrency_test.exs test/product_compare/recommendations_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/recommendations_test.exs test/product_compare_web/graphql/specification_corrections_test.exs
  ```

- [x] **Step 2: Run repository gates**

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [x] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results. The coordinator
  updates the shared queue, catalog, and history only while preserving at least
  three other ready rows.

- [x] **Step 4: Commit closeout**

  Commit message: `docs: close specification definition creation validity`

Exit condition: PostgreSQL rejects invalid newly inserted Attributes and Units,
valid definitions and existing immutability behavior remain unchanged, and all
backend gates pass.
