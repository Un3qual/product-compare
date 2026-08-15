# Development Seed Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce unchanged full development-seed reruns below 3,000 SQL queries while preserving every inventory, ownership, identity, lifecycle, and profile-switch contract.

**Architecture:** Add seed-only schema-validation and changed-row synchronization helpers, then apply them to deterministic generated catalog, marketplace, engagement, and operations rows. Keep named behavioral fixtures and lifecycle-sensitive production context flows unchanged.

**Tech Stack:** Elixir 1.19, Ecto, PostgreSQL, ExUnit telemetry query capture

## Global Constraints

- Preserve exactly 300 products and 70 merchants in both profiles.
- Preserve bounded 1,700–1,900 offers and full 2,900–3,100 offers.
- Preserve stable database identities on unchanged reruns.
- Preserve unrelated local rows and fail closed on natural-identity conflicts.
- Validate every generated bulk row through its owning schema changeset.
- Keep the existing serializable all-or-nothing transaction.
- Keep named scenarios on their current production context paths.
- Do not add production APIs, dependencies, or timing-based tests.

---

### Task 1: Establish the unchanged-rerun query budget

**Files:**
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Consumes: `ProductCompare.DatabaseTestHelpers.capture_queries/1`.
- Produces: a regression assertion that unchanged full reruns execute fewer than 3,000 SQL queries.

- [ ] Wrap the existing second full-profile run in `capture_queries/1`.
- [ ] Assert the returned seed preserves the existing identity inventory.
- [ ] Assert the captured query count is below 3,000.
- [ ] Run the single test and witness failure near the measured 13,000-query baseline.

### Task 2: Add validated changed-row synchronization

**Files:**
- Modify: `priv/repo/seeds/support.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Produces: `validated_row!/3`, which applies a schema changeset and returns only persisted fields plus seed metadata.
- Produces: `sync_owned_rows!/4`, which checks existing entropy ownership, writes missing or changed rows in chunks, and returns all expected structs in input order.

- [ ] Add focused tests for validation failure, unchanged no-op behavior, changed-row restoration, and ordered return values.
- [ ] Run the focused tests and witness the missing-helper failures.
- [ ] Implement the smallest schema-aware helpers that satisfy those tests.
- [ ] Run the focused tests and commit the reusable seed persistence milestone.

### Task 3: Bulk-synchronize generated catalog rows

**Files:**
- Modify: `priv/repo/seeds/catalog.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Consumes: the Task 2 support helpers.
- Produces: batched generated products, use-case assignments, identifiers, and media with existing return shapes.

- [ ] Add stage-level query assertions for an unchanged generated catalog rerun.
- [ ] Witness the current record-at-a-time query count fail the assertion.
- [ ] Prefetch natural identities once, fail closed on ownership conflicts, validate rows, and synchronize by entropy identifier.
- [ ] Run catalog and complete seed regression tests and commit the catalog milestone.

### Task 4: Make generated marketplace history unchanged-aware

**Files:**
- Modify: `priv/repo/seeds/generated_marketplace.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Consumes: expected price rows and existing entropy ownership checks.
- Produces: inserts for missing observations and updates only for changed observations.

- [ ] Add a query assertion proving an unchanged history rerun performs no price-row upsert chunks.
- [ ] Witness the existing unconditional upserts fail the assertion.
- [ ] Reuse the ownership preload to filter unchanged rows before chunked persistence.
- [ ] Run marketplace and profile-switch regressions and commit the marketplace milestone.

### Task 5: Synchronize generated engagement rows in place

**Files:**
- Modify: `priv/repo/seeds/generated_engagement.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Consumes: the Task 2 support helpers.
- Produces: stable saved-set, saved-item, watch, alert, review, question, answer, and correction identities without unchanged delete/recreate work.

- [ ] Add query assertions around an unchanged generated engagement rerun.
- [ ] Witness the current delete/recreate and record-at-a-time paths fail.
- [ ] Synchronize saved sets/items and watches directly after changeset validation.
- [ ] Prefetch remaining generated community rows and skip production writes when their persisted state already matches.
- [ ] Run lifecycle, preservation, and profile-switch regressions and commit the engagement milestone.

### Task 6: Bulk-synchronize generated operations rows

**Files:**
- Modify: `priv/repo/seeds/generated_operations.exs`
- Modify: `test/product_compare/repo/seeds_test.exs`

**Interfaces:**
- Consumes: the Task 2 support helpers.
- Produces: batched feeds, imports, clicks, conversions, and purchase facts; existing CJ program lifecycle handling remains intact.

- [ ] Add query assertions around an unchanged generated operations rerun.
- [ ] Witness the current lookup/update loops fail.
- [ ] Prefetch natural identities, validate rows, synchronize bulk-safe records, and preserve lifecycle-sensitive CJ program behavior.
- [ ] Run operations, attribution-restoration, and full-to-bounded regressions and commit the operations milestone.

### Task 7: Verify the aggregate performance contract

**Files:**
- Modify only if verification exposes a defect in the owned seed paths.

**Interfaces:**
- Consumes: the unchanged full-rerun query-budget regression.
- Produces: fresh bounded, full, and unchanged-rerun timing/query evidence.

- [ ] Run the aggregate query-budget test and confirm fewer than 3,000 queries.
- [ ] Run the complete seed regression file.
- [ ] Run `mix format --check-formatted`, `mix ci`, and `git diff --check`.
- [ ] Re-run the telemetry profiler and record bounded, full, and unchanged-full results.
- [ ] Commit any verification fixes, push the existing branch, and report evidence.
