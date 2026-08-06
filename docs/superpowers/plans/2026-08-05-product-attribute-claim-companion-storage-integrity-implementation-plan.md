# Product Attribute Claim Companion Storage Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the complete, ordered numeric companion
representation already required by ProductAttributeClaim changesets.

**Architecture:** Freeze the three existing companion relationships with
direct-write tests, add one named PostgreSQL check per relationship, and map
those names in the owning changeset. Preserve all typed-value, import, unit,
and claim-read behavior.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve exactly-one-typed-value, confidence, fingerprint, import, unit
  conversion, moderation, and claim-read behavior.
- Keep normalized minimum and maximum independently nullable.
- Add no sign, precision, containment, conversion, or generic numeric policy.
- Stop rather than rewriting persisted evidence if preflight finds a violation.
- Use a forward migration and never reset the development database.

---

### Task 1: Characterize Numeric Companion Direct Writes

**Files:**

- Create: `test/product_compare/repo/product_attribute_claim_companion_storage_integrity_test.exs`
- Read: `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- Read: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`

**Interfaces:**

- Consumes: the existing `product_attribute_claims` table and minimum valid
  product, attribute, unit, and source fixtures.
- Produces: exact direct-write regressions for three planned named checks.

- [ ] **Step 1: Add failing companion-shape cases**

  Use `ProductCompare.Repo.query/2` in the SQL sandbox. Assert that a nonnumeric
  typed claim with `unit_id` or any normalized numeric companion fails under
  `product_attribute_claims_numeric_companions_require_value`. Assert that a
  numeric claim missing `unit_id` or `value_num_base` fails under
  `product_attribute_claims_numeric_value_requires_companions`.

- [ ] **Step 2: Add failing range order and accepted controls**

  Assert that `value_num_base_min > value_num_base_max` fails under
  `product_attribute_claims_numeric_range_ordered`. Add distinct valid controls
  for a nonnumeric claim with no companions, a numeric claim with required
  companions, and numeric claims with no range, one-sided ranges, and an
  ordered two-sided range.

- [ ] **Step 3: Verify RED**

  Run:

  ```bash
  mix test test/product_compare/repo/product_attribute_claim_companion_storage_integrity_test.exs
  ```

  Expected before the migration: PostgreSQL accepts the invalid direct writes,
  so the exact constraint-name assertions fail.

### Task 2: Add and Map the Three Named Checks

**Files:**

- Create: `priv/repo/migrations/20260805020000_enforce_product_attribute_claim_companion_integrity.exs`
- Modify: `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- Test: `test/product_compare/repo/product_attribute_claim_companion_storage_integrity_test.exs`
- Verify: `test/product_compare/specs/product_attribute_claim_changeset_test.exs`
- Verify: `test/product_compare/specs/product_attribute_claim_db_constraint_test.exs`

**Interfaces:**

- Consumes: the direct-write contract frozen in Task 1.
- Produces: three reversible checks and owning changeset mappings.

- [ ] **Step 1: Run the read-only preflight**

  Run the design query that identifies orphan companions, missing required
  companions, or inverted ranges. Expected: zero rows. Stop and report exact
  claim IDs and fields if it returns data; do not mutate evidence.

- [ ] **Step 2: Add the reversible forward migration**

  Create these exact predicates:

  ```sql
  value_num IS NOT NULL OR
    (unit_id IS NULL AND value_num_base IS NULL AND
     value_num_base_min IS NULL AND value_num_base_max IS NULL)

  value_num IS NULL OR (unit_id IS NOT NULL AND value_num_base IS NOT NULL)

  value_num_base_min IS NULL OR value_num_base_max IS NULL OR
    value_num_base_min <= value_num_base_max
  ```

  Name them, in order,
  `product_attribute_claims_numeric_companions_require_value`,
  `product_attribute_claims_numeric_value_requires_companions`, and
  `product_attribute_claims_numeric_range_ordered`. `down/0` removes only those
  names.

- [ ] **Step 3: Map failures in the owning changeset**

  Add `check_constraint/3` mappings to the fields already used by the matching
  validation errors. Do not change `validate_numeric_fields/1`,
  `validate_numeric_range_order/1`, or their messages.

- [ ] **Step 4: Apply and verify GREEN**

  Run:

  ```bash
  MIX_ENV=test mix ecto.migrate
  mix test test/product_compare/repo/product_attribute_claim_companion_storage_integrity_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/specs/product_attribute_claim_db_constraint_test.exs
  ```

  Expected: every invalid direct write returns its exact named check, every
  valid control succeeds, and the existing 11-test claim baseline remains
  green.

- [ ] **Step 5: Commit the storage milestone**

  Commit message: `fix: constrain product attribute claim companions`

### Task 3: Verify Claim Lifecycle Parity and Close

**Files:**

- Modify: `docs/work/product-attribute-claim-companion-storage-integrity.md`
- Modify at coordinator closeout only: `docs/work/index.md`,
  `docs/plans/INDEX.md`, `docs/plans/2026-07-31-work-index-history.md`, and this
  implementation plan.

**Interfaces:**

- Consumes: the three named checks and passing focused suites.
- Produces: observed lifecycle and repository-gate evidence.

- [ ] **Step 1: Run affected claim import and read suites**

  Run the existing specification claim import/backfill, catalog projection,
  recommendation, and correction suites that create or read numeric claims.

- [ ] **Step 2: Run repository gates**

  ```bash
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results. The coordinator
  updates the shared queue, catalog, and history only while preserving at least
  three other ready rows.

- [ ] **Step 4: Commit closeout**

  Commit message: `docs: close product attribute claim companion integrity`

Exit condition: PostgreSQL rejects incomplete or inverted numeric companion
representations, valid typed claims remain accepted, claim behavior is
unchanged, and all backend gates pass.
