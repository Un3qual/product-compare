# Captured Numeric Evidence Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL enforce the established numeric domains of immutable comparison evidence and copied alert facts.

**Architecture:** Add named checks to the unreleased migrations that create comparison snapshots, price-watch rules, and alert events. Prove the database boundary through direct invalid writes and retain existing application capture behavior unchanged.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve all GraphQL and frontend contracts.
- Modify only unreleased first-party migrations; never reset the development database.
- Do not add decimal precision or scale limits.
- Leave signed price deltas, specification numeric values, and unit offsets outside this batch.
- Add no generic numeric-policy production module.

---

## Task 1: Freeze The Missing Database Boundary

**Files:**

- Create: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Read: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Read: `priv/repo/migrations/20260713180000_create_comparison_snapshots.exs`

**Interfaces:**

- Consumes: the current PostgreSQL schema created by the two unreleased migrations.
- Produces: direct database regressions for the five named copied-evidence constraints.

- [x] **Step 1: Add failing direct-write tests**

  Add one focused test per constraint family. Insert the minimum valid parent
  rows, then use `ProductCompare.Repo.query/2` inside the SQL sandbox to prove:

  - `comparison_snapshot_attributes.confidence` rejects values below zero and above one.
  - `comparison_snapshot_offers` rejects negative item, shipping, or landed prices.
  - `comparison_snapshot_rankings.landed_price` rejects negative values.
  - `price_watch_rules.baseline_landed_price` rejects negative values.
  - `alert_events` rejects negative monetary evidence and percentage drops outside `(0, 100]`.

- [x] **Step 2: Run the focused test and verify RED**

  Run: `mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`

  Expected: the invalid direct writes succeed because the copied tables do not yet own the checks.

- [x] **Step 3: Confirm valid boundary fixtures**

  Keep zero monetary values, confidence values `0` and `1`, and percentage
  values greater than zero through `100` as accepted controls in the same
  focused suite.

## Task 2: Add Named Captured-Evidence Constraints

**Files:**

- Modify: `priv/repo/migrations/20260713170000_add_price_watches_and_alerts.exs`
- Modify: `priv/repo/migrations/20260713180000_create_comparison_snapshots.exs`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Test: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`

**Interfaces:**

- Consumes: the exact numeric domains frozen by Task 1.
- Produces: named PostgreSQL checks and changeset mapping for the mutable price-watch rule boundary.

- [x] **Step 1: Constrain comparison snapshot copies**

  Add these named checks to the snapshot migration:

  - `comparison_snapshot_attributes_confidence_range`
  - `comparison_snapshot_offers_amounts_non_negative`
  - `comparison_snapshot_rankings_landed_price_non_negative`

  Confidence permits `NULL` or `0..1`. Snapshot offer monetary columns and
  ranking landed price must be greater than or equal to zero.

- [x] **Step 2: Constrain alert and watch copies**

  Add these named checks to the alert migration:

  - `price_watch_rules_baseline_landed_price_non_negative`
  - `alert_events_numeric_evidence_bounds`

  The alert-event check requires nonnegative item, shipping, and landed prices;
  permits nullable baseline and target amounts only when nonnegative; and
  permits nullable percentage drops only in `(0, 100]`.

- [x] **Step 3: Map the mutable watch constraint**

  Add `check_constraint/3` for
  `price_watch_rules_baseline_landed_price_non_negative` to the existing price
  watch changeset. Do not add changesets solely for immutable snapshot or alert
  rows written by trusted capture code.

- [x] **Step 4: Run the focused test and verify GREEN**

  Run: `MIX_ENV=test mix ecto.reset`

  Run: `mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`

  Expected: all valid controls pass and every invalid direct write returns the
  expected named check-constraint violation.

- [x] **Step 5: Commit the database boundary milestone**

  Commit message: `fix: constrain captured numeric evidence`

## Task 3: Verify Lifecycle Parity And Close

**Files:**

- Modify: `docs/work/captured-numeric-evidence-constraints.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/INDEX.md`

**Interfaces:**

- Consumes: the database boundary delivered by Task 2.
- Produces: verified completion evidence and a replenished live queue.

- [x] **Step 1: Run affected lifecycle suites**

  Run comparison snapshot, alert, pricing, specification-claim, taxonomy, and
  commerce-attribution suites that own the source and copied numeric facts.

- [x] **Step 2: Run repository gates**

  Run:

  - `mix test`
  - `mix typecheck`
  - `mix quality`
  - `mix format --check-formatted`
  - `mix work_queue.validate`
  - `git diff --check`

- [x] **Step 3: Record evidence and close the row**

  Replace prospective lane language with observed results, remove the completed
  row only at a coordinator boundary that still preserves at least three other
  ready rows, and update the plan catalog in the same commit.

- [x] **Step 4: Commit closeout**

  Commit message: `docs: close captured numeric evidence constraints`

Exit condition: PostgreSQL rejects impossible copied comparison and alert numeric evidence, valid boundary values remain accepted, public behavior is unchanged, and all backend gates pass.
