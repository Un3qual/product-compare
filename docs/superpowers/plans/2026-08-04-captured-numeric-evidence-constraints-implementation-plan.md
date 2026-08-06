# Captured Numeric Evidence Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PostgreSQL enforce the established numeric domains of source price facts, immutable comparison evidence, and copied alert facts.

**Architecture:** Add forward migrations that install named checks on the existing price-point, comparison-snapshot, price-watch, and alert-event tables. Prove both upgrade behavior and the database boundary through direct invalid writes while retaining existing application capture behavior unchanged.

**Tech Stack:** Elixir, Ecto SQL, PostgreSQL check constraints, ExUnit.

## Global Constraints

- Preserve all GraphQL and frontend contracts.
- Put database changes in a new forward migration; never rewrite an applied migration or reset the development database.
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

- Consumes: the current PostgreSQL schema created by the two existing migrations.
- Produces: direct database regressions for the five named copied-evidence constraints.

- [x] **Step 1: Add failing direct-write tests**

  Add one focused test per constraint family. Insert the minimum valid parent
  rows, then use `ProductCompare.Repo.query/2` inside the SQL sandbox to prove:

  - `comparison_snapshot_attributes.confidence` rejects values below zero and above one.
  - `comparison_snapshot_offers` rejects negative or non-finite item, shipping, or landed prices.
  - `comparison_snapshot_rankings.landed_price` rejects negative and non-finite values.
  - `price_watch_rules.baseline_landed_price` rejects negative and non-finite values.
  - `alert_events` rejects negative or non-finite monetary evidence and percentage drops outside `(0, 100]`.

- [x] **Step 2: Run the focused test and verify RED**

  Run: `mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`

  Expected: the invalid direct writes succeed because the copied tables do not yet own the checks.

- [x] **Step 3: Confirm valid boundary fixtures**

  Keep zero monetary values, confidence values `0` and `1`, and percentage
  values greater than zero through `100` as accepted controls in the same
  focused suite.

## Task 2: Add Named Captured-Evidence Constraints

**Files:**

- Create: `priv/repo/migrations/20260805170000_enforce_captured_numeric_evidence_constraints.exs`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Test: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Create: `test/product_compare/repo/migrations/enforce_captured_numeric_evidence_constraints_test.exs`

**Interfaces:**

- Consumes: the exact numeric domains frozen by Task 1.
- Produces: deployable named PostgreSQL checks, finite captured monetary evidence, and changeset mapping for the mutable price-watch rule boundary.

- [x] **Step 1: Constrain comparison snapshot copies**

  Add these named checks to the forward migration:

  - `comparison_snapshot_attributes_confidence_range`
  - `comparison_snapshot_offers_amounts_non_negative`
  - `comparison_snapshot_rankings_landed_price_non_negative`

  Confidence permits `NULL` or `0..1`. Snapshot offer monetary columns and
  ranking landed price must be finite and greater than or equal to zero.

- [x] **Step 2: Constrain alert and watch copies**

  Add these named checks to the forward migration:

  - `price_watch_rules_baseline_landed_price_non_negative`
  - `alert_events_numeric_evidence_bounds`

  The alert-event check requires finite nonnegative item, shipping, and landed
  prices; permits nullable baseline and target amounts only when finite and nonnegative; and
  permits nullable percentage drops only in `(0, 100]`.

- [x] **Step 3: Map the mutable watch constraint**

  Add `check_constraint/3` for
  `price_watch_rules_baseline_landed_price_non_negative` to the existing price
  watch changeset. Do not add changesets solely for immutable snapshot or alert
  rows written by trusted capture code.

- [x] **Step 4: Run the focused test and verify GREEN**

  Run: `mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs test/product_compare/repo/migrations/enforce_captured_numeric_evidence_constraints_test.exs`

  Expected: the migration upgrades and rolls back an already-created schema,
  all valid controls pass, and every invalid direct write returns the expected
  named check-constraint violation.

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

## Task 4: Prevent Non-Finite Source Rows From Poisoning Evidence Capture

**Files:**

- Create: `priv/repo/migrations/20260805180000_enforce_source_numeric_evidence_constraints.exs`
- Modify: `lib/product_compare_schemas/schema.ex`
- Modify: `lib/product_compare_schemas/pricing/price_point.ex`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Modify: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Create: `test/product_compare/repo/migrations/enforce_source_numeric_evidence_constraints_test.exs`

- [x] **Step 1: Reproduce the direct-write source gap**

  Prove PostgreSQL accepts `NaN` and positive `Infinity` in source
  `price_points.price`, `price_points.shipping`, and
  `price_watch_rules.target_amount` even though later evidence copies reject
  those values.

- [x] **Step 2: Add a separate forward migration**

  Add source constraints in a new timestamped migration because the captured
  evidence migration was already applied in this checkout. Do not filter or
  coerce invalid source values during snapshot or alert copying.

- [x] **Step 3: Prove upgrade and rollback behavior**

  Apply the source migration to an isolated legacy schema, verify finite zero
  and nullable values remain valid, verify non-finite writes fail with the
  expected named constraints, then prove rollback removes the checks.

- [x] **Step 4: Keep application callers on typed error paths**

  Normalize Decimal `NaN` and infinities before Ecto's decimal cast can raise,
  and register the source constraint names on the price-point and create/update
  watch changesets. Prove application writes return field errors for all three
  Decimal special-value forms.

- [x] **Step 5: Run repository gates and publish the review follow-up**

Exit condition: forward migrations protect already-migrated databases,
PostgreSQL rejects impossible or non-finite source, comparison, and alert
numeric evidence, valid finite boundary values remain accepted, public behavior
is unchanged, and all backend gates pass.
