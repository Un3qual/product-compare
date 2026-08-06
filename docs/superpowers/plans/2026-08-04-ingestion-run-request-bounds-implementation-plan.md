# Ingestion Run Request Bounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL preserve the established positive-when-present bounds of import-run request metadata.

**Architecture:** Add one forward migration with separate named checks for nullable `page_size` and `pages_requested`, map the failures through the owning import-run changeset, and prove the database boundary with direct writes while keeping ingestion behavior unchanged.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve ingestion scheduling, provider, cursor, reconciliation, and source-health contracts.
- Keep `page_size` and `pages_requested` nullable.
- Add no upper bounds or requested-versus-fetched relationship.
- Do not change result-counter policy or add a generic numeric-policy module.
- Use a forward migration and never reset the development database.

---

## Task 1: Freeze The Request-Metadata Boundary

**Files:**

- Create: `test/product_compare/repo/ingestion_run_request_bounds_test.exs`
- Read: `lib/product_compare_schemas/ingestion/import_run.ex`
- Read: `priv/repo/migrations/20260604191000_create_ingestion_runs.exs`

**Interfaces:**

- Consumes: the current `ingestion_runs` PostgreSQL table.
- Produces: direct-write regressions for two named positive-when-present checks.

- [ ] **Step 1: Add failing direct-write tests**

  Insert the minimum valid source and ingestion-run rows through
  `ProductCompare.Repo.query/2` inside the SQL sandbox. Assert that zero and a
  negative value for each request field return the planned exact constraint
  name.

- [ ] **Step 2: Add accepted-boundary controls**

  Insert distinct valid rows proving that `NULL` and `1` remain accepted for
  both fields.

- [ ] **Step 3: Run the focused test and verify RED**

  Run: `mix test test/product_compare/repo/ingestion_run_request_bounds_test.exs`

  Expected: invalid direct writes succeed because PostgreSQL does not yet own
  either request-metadata bound.

## Task 2: Enforce And Map The Named Bounds

**Files:**

- Create: `priv/repo/migrations/20260804230000_enforce_ingestion_run_request_bounds.exs`
- Modify: `lib/product_compare_schemas/ingestion/import_run.ex`
- Test: `test/product_compare/repo/ingestion_run_request_bounds_test.exs`

**Interfaces:**

- Consumes: the exact nullable-positive contract frozen by Task 1.
- Produces: two named PostgreSQL checks and owning changeset mappings.

- [ ] **Step 1: Add the forward migration**

  Add `ingestion_runs_page_size_positive` and
  `ingestion_runs_pages_requested_positive`. Each check permits `NULL` and
  otherwise requires its field to be greater than zero. Make `down/0` remove
  both checks.

- [ ] **Step 2: Map constraint failures**

  Add one `check_constraint/3` mapping per field in
  `ImportRun.changeset/2`. Preserve the existing application validations and
  error behavior.

- [ ] **Step 3: Apply the migration to the test database**

  Run: `MIX_ENV=test mix ecto.migrate`

  If existing test data blocks the migration, report the exact field and
  value. Do not reset the development database or mutate durable history.

- [ ] **Step 4: Run the focused suite and verify GREEN**

  Run: `mix test test/product_compare/repo/ingestion_run_request_bounds_test.exs`

  Expected: all invalid writes return their exact named check and all valid
  boundaries succeed.

- [ ] **Step 5: Commit the storage-boundary milestone**

  Commit message: `fix: constrain ingestion run request bounds`

## Task 3: Verify Ingestion Lifecycle Parity And Close

**Files:**

- Modify: `docs/work/ingestion-run-request-bounds.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `docs/plans/2026-07-31-work-index-history.md`
- Modify: `docs/superpowers/plans/2026-08-04-ingestion-run-request-bounds-implementation-plan.md`

**Interfaces:**

- Consumes: the database checks and schema mappings delivered by Task 2.
- Produces: lifecycle verification evidence and a queue closeout retaining at least three other ready rows.

- [ ] **Step 1: Run affected ingestion suites**

  Run the import-run, scheduled-cursor, reconciliation, source-health, and CJ
  run-health suites that own or read request metadata.

- [ ] **Step 2: Run repository gates**

  Run:

  - `mix test`
  - `mix typecheck`
  - `mix quality`
  - `mix format --check-formatted`
  - `mix work_queue.validate`
  - `git diff --check`

- [ ] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results, remove the
  completed row only when at least three other complete ready rows remain,
  update the catalog and dated history, and mark this plan complete.

- [ ] **Step 4: Commit closeout**

  Commit message: `docs: close ingestion run request bounds`

Exit condition: PostgreSQL rejects zero and negative import-run request metadata, null and positive values remain accepted, ingestion behavior is unchanged, and all backend gates pass.
