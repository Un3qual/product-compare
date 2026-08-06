# Product Attribute Claim Scope Storage Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Ready. Live preflight and focused baseline passed on 2026-08-06.

**Goal:** Make PostgreSQL preserve the established rule that current
selections and specification corrections reference claims from their own
product-and-attribute scope.

**Architecture:** Create one unique composite target on
`product_attribute_claims(product_id, attribute_id, id)`. Replace the two
dependent single-column claim foreign keys with named composite foreign keys
from `(product_id, attribute_id, claim_id)`, preserving `ON DELETE CASCADE`.
Map both names through the owning changesets and prove direct-write enforcement
without adding application queries or triggers.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL composite foreign keys and unique
indexes, ExUnit.

## Global Constraints

- Preserve `ON DELETE CASCADE` for current selections and corrections when a
  claim is deleted.
- Preserve the independent product and attribute foreign keys, current-row and
  correction uniqueness, and existing transaction locks.
- Do not enforce claim status in PostgreSQL or change accepted, proposed,
  rejected, or superseded lifecycle policy.
- Do not add changeset repository queries, triggers, data repair, generic
  referential-integrity abstractions, regexes, or text normalization.
- Use one forward migration with explicit reversible `up/0` and `down/0`.
- Stop on nonzero preflight, schema-definition drift, or a failing focused
  baseline.
- Workers may update only the task-owned implementation files and lane/plan.
  `docs/work/index.md`, `docs/plans/INDEX.md`, and
  `docs/plans/2026-07-31-work-index-history.md` remain coordinator-only shared
  closeout paths.

## Task 1: Establish Preflight, Baseline, And RED

**Files:**

- Create: `test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`
- Read: `lib/product_compare/specs/claims/moderation.ex`
- Read: `lib/product_compare/specs/claims/imports.ex`
- Read: `lib/product_compare/specs/corrections.ex`
- Read: `lib/product_compare_schemas/specs/product_attribute_current.ex`
- Read: `lib/product_compare_schemas/specs/specification_correction.ex`
- Read: `priv/repo/migrations/20260303222610_create_specs_and_sources.exs`
- Read: `priv/repo/migrations/20260713160000_add_specification_corrections.exs`
- Test: `test/product_compare/specs/current_claim_selection_test.exs`
- Test: `test/product_compare/specs/corrections_test.exs`

**Interfaces:**

- Consumes: the existing application claim-scope rule and two original
  single-column claim foreign keys.
- Produces: fresh zero-violation and baseline evidence plus direct-write RED
  tests for the planned composite constraints.

- [ ] **Step 1: Run the exact read-only data preflight**

  After the shared test database is free, run:

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

  Expected: both rows report `violating_rows = 0`. If either count is nonzero,
  stop and report the table, dependent IDs, claim IDs, and both scopes. Do not
  relink or delete data.

- [ ] **Step 2: Confirm the live original foreign keys**

  Run:

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
  ORDER BY table_name::text;
  ```

  Expected: both named constraints are single-column `claim_id` foreign keys
  to `product_attribute_claims(id)` with `ON DELETE CASCADE`. Stop on drift.

- [ ] **Step 3: Record a fresh focused baseline**

  Run:

  ```sh
  mix test test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs
  ```

  The current static inventory is 15 tests. Record the observed count and
  result; stop if the baseline fails.

- [ ] **Step 4: Add all direct-write cases**

  Build valid current-selection and correction fixtures, then use direct SQL
  updates with other valid product and attribute IDs. Add separate tests for:

  - current-selection product mismatch;
  - current-selection attribute mismatch;
  - correction product mismatch;
  - correction attribute mismatch;
  - exact-scope current acceptance;
  - exact-scope correction acceptance;
  - claim deletion cascading the current row; and
  - claim deletion cascading the correction row.

  Match `:foreign_key_violation` and the exact planned constraint name for all
  four mismatch cases. Keep the two accepted-scope and two cascade controls
  passing before migration.

- [ ] **Step 5: Verify RED**

  Run:

  ```sh
  mix test test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs
  ```

  Expected: the four mismatch assertions fail because the valid cross-wired
  writes currently succeed. The exact-scope and cascade controls pass.

- [ ] **Step 6: Commit the characterization milestone**

  Commit message: `test: characterize product attribute claim scope`

## Task 2: Add Reversible Composite Referential Integrity

**Files:**

- Create: `priv/repo/migrations/20260805060000_enforce_product_attribute_claim_scope_integrity.exs`
- Modify: `lib/product_compare_schemas/specs/product_attribute_current.ex`
- Modify: `lib/product_compare_schemas/specs/specification_correction.ex`
- Test: `test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs`

**Interfaces:**

- Consumes: clean preflight evidence and the four RED mismatch cases.
- Produces: `product_attribute_claims_product_attribute_id_uq`,
  `product_attribute_current_claim_scope_fkey`, and
  `specification_corrections_claim_scope_fkey`.

- [ ] **Step 1: Re-run preflight immediately before migration**

  Re-run both exact Task 1 read-only queries. Require zero mismatch counts and
  the two expected original `ON DELETE CASCADE` definitions.

- [ ] **Step 2: Implement explicit `up/0`**

  Create unique index
  `product_attribute_claims_product_attribute_id_uq` on
  `(product_id, attribute_id, id)`. In the same transactional migration,
  replace the old claim foreign keys with:

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

  Do not retain redundant single-column claim foreign keys.

- [ ] **Step 3: Implement explicit `down/0`**

  Reverse in dependency-safe order:

  1. drop `product_attribute_current_claim_scope_fkey` and
     `specification_corrections_claim_scope_fkey`;
  2. recreate `product_attribute_current_claim_id_fkey` and
     `specification_corrections_claim_id_fkey` as single-column `claim_id`
     foreign keys to `product_attribute_claims(id)` with `ON DELETE CASCADE`;
     and
  3. drop `product_attribute_claims_product_attribute_id_uq` last.

  Do not use a generic rollback step against the shared test database: this
  candidate's timestamp precedes already-applied later migrations. Review the
  exact reverse SQL and exercise it only in a disposable isolated database if
  additional rollback proof is required.

- [ ] **Step 4: Map both named composite constraints**

  In `ProductAttributeCurrent.changeset/2`, replace the old default claim FK
  mapping with:

  ```elixir
  foreign_key_constraint(:claim_id,
    name: :product_attribute_current_claim_scope_fkey
  )
  ```

  In `SpecificationCorrection.changeset/2`, add:

  ```elixir
  foreign_key_constraint(:claim_id,
    name: :specification_corrections_claim_scope_fkey
  )
  ```

  Assign a composite-scope violation to `:claim_id`; keep every other
  validation and relationship unchanged.

- [ ] **Step 5: Apply the test migration**

  Run:

  ```sh
  MIX_ENV=test mix ecto.migrate
  ```

- [ ] **Step 6: Verify GREEN and application mapping**

  Run:

  ```sh
  mix test test/product_compare/repo/product_attribute_claim_scope_storage_integrity_test.exs test/product_compare/specs/current_claim_selection_test.exs test/product_compare/specs/corrections_test.exs
  ```

  Expected: both mismatch dimensions fail under the correct named constraint
  for both dependent tables; exact-scope and both `ON DELETE CASCADE` controls
  pass; existing application mismatch behavior remains unchanged.

- [ ] **Step 7: Commit the storage milestone**

  Commit message: `fix: enforce product attribute claim scope`

## Task 3: Verify Consumers And Prepare Coordinator Closeout

**Files:**

- Verify: `test/product_compare/specs/concurrency_test.exs`
- Verify: `test/product_compare/specs/read_helpers_test.exs`
- Verify: `test/product_compare/ingestion/enrichment_test.exs`
- Verify: `test/product_compare/repo/seeds_test.exs`
- Verify: `test/product_compare/catalog/filter_metadata_test.exs`
- Verify: `test/product_compare/catalog/filtering_regression_test.exs`
- Verify: `test/product_compare/recommendations_test.exs`
- Verify: `test/product_compare/comparison_snapshots_test.exs`
- Verify: `test/product_compare/seo_test.exs`
- Verify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `docs/work/product-attribute-claim-scope-storage-integrity.md`
- Modify: `docs/superpowers/plans/2026-08-06-product-attribute-claim-scope-storage-integrity-implementation-plan.md`
- Coordinator closeout only: `docs/work/index.md`
- Coordinator closeout only: `docs/plans/INDEX.md`
- Coordinator closeout only: `docs/plans/2026-07-31-work-index-history.md`

**Interfaces:**

- Consumes: named composite referential integrity and unchanged application
  claim lifecycle.
- Produces: claim, correction, ingestion, seed, catalog, recommendation,
  snapshot, SEO, GraphQL, and full backend evidence for coordinator closeout.

- [ ] **Step 1: Run claim lifecycle consumers**

  Run:

  ```sh
  mix test test/product_compare/specs/concurrency_test.exs test/product_compare/specs/read_helpers_test.exs test/product_compare/ingestion/enrichment_test.exs test/product_compare/repo/seeds_test.exs
  ```

  The current static inventory is 62 tests. Record observed results.

- [ ] **Step 2: Run read-model consumers**

  Run:

  ```sh
  mix test test/product_compare/catalog/filter_metadata_test.exs test/product_compare/catalog/filtering_regression_test.exs test/product_compare/recommendations_test.exs test/product_compare/comparison_snapshots_test.exs test/product_compare/seo_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
  ```

  The current static inventory is 86 tests. Record observed results.

- [ ] **Step 3: Run repository gates**

  Run:

  ```sh
  mix test
  mix typecheck
  mix quality
  mix format --check-formatted
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 4: Record implementation evidence**

  Replace prospective lane and plan language with the observed preflight,
  RED, GREEN, downstream, and full-gate results. Do not edit coordinator-owned
  shared files.

- [ ] **Step 5: Hand off coordinator closeout**

  The coordinator alone may promote or close the row and update
  `docs/work/index.md`, `docs/plans/INDEX.md`, and
  `docs/plans/2026-07-31-work-index-history.md`. The coordinator must preserve
  the ready-row floor and record truthful lane evidence at the same dispatch
  boundary.

- [ ] **Step 6: Commit implementation evidence**

  Commit message: `docs: verify product attribute claim scope integrity`

Exit condition: the live preflight is clean; PostgreSQL rejects both mismatch
dimensions for both dependent tables under the exact composite constraint
names; exact-scope and claim-deletion controls retain current behavior; all
focused, downstream, and repository gates pass; and coordinator-only queue
closeout remains a separate dispatch action.
