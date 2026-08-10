# Database Constraint Parity Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three confirmed review gaps in the database-constraint parity branch without adding a framework or changing product policy.

**Architecture:** Extend the existing thread-row lock protocol to physical post deletion so every path uses thread-before-post ordering. Reuse `ProductCompareSchemas.Schema.normalize_non_finite_decimals/2` at the remaining constrained Decimal changesets, and extend the fixed-scope mapping suite with real PostgreSQL writes for the nine owners that currently have metadata-only coverage.

**Tech Stack:** Elixir 1.19, Ecto 3.13, PostgreSQL 18, ExUnit.

## Global Constraints

- Preserve every public success and error return shape.
- Keep race-sensitive reads, locks, and writes in one `Repo.transaction/2`.
- Use ordinary behavior tests; add no registry, source scanner, DSL, or catalog-driven CI policy.
- Add no new database constraint or product policy.
- Follow strict RED/GREEN cycles and commit only complete code/test milestones.

---

### Task 1: Make Post Deletion Follow Thread-First Lock Ordering

**Files:**

- Modify: `test/product_compare/discussions/thread_post_validation_test.exs`
- Modify: `lib/product_compare/discussions/content_lifecycle.ex`

**Interfaces:**

- Consumes: `ContentLifecycle.create_post/1`, `ContentLifecycle.delete_post/1`, `ProductThread.accepted_post_id`, and the existing `FOR UPDATE` thread lock protocol.
- Produces: unchanged `delete_post/1` result shape with deletion serialized behind the post's thread row.

- [ ] **Step 1: Write the failing concurrency test**

Add a real unboxed PostgreSQL test that creates a committed thread and marks
one post as its accepted answer. Hold the thread row lock, start
`Discussions.delete_post/1`, and prove the delete is blocked by that holder.
While deletion is blocked, acquire and release `FOR UPDATE` on the post from a
third transaction. The third transaction can acquire the post only when delete
waits on the thread before touching the post; the current delete-first path
already owns the post lock and makes this assertion time out.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
mix test test/product_compare/discussions/thread_post_validation_test.exs
```

Expected: the new lock-order assertion fails because `delete_post/1` currently reaches the post before the thread.

- [ ] **Step 3: Implement the minimal transaction-owned delete**

Change `delete_post/1` to run one `Repo.transaction/2`, lock the persisted post's `ProductThread` row with `FOR UPDATE`, delete the post, and roll back a returned changeset on error. Return `{:ok, post} | {:error, changeset}` exactly as before.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run the Task 1 command again and require zero failures.

### Task 2: Return Changeset Errors For Remaining Non-Finite Decimal Inputs

**Files:**

- Modify: `test/product_compare/repo/captured_numeric_evidence_constraints_test.exs`
- Modify: `lib/product_compare_schemas/alerts/price_watch_rule.ex`
- Modify: `lib/product_compare_schemas/specs/product_attribute_claim.ex`
- Modify: `lib/product_compare_schemas/taxonomy/product_taxon.ex`

**Interfaces:**

- Consumes: `Schema.normalize_non_finite_decimals/2` and each owner's existing range validator and named check mapping.
- Produces: invalid changesets, never `ArgumentError`, for NaN and positive or negative infinity.

- [ ] **Step 1: Write failing changeset behavior tests**

For `PriceWatchRule.percentage_drop` in create and update changesets, `ProductAttributeClaim.confidence`, and `ProductTaxon.confidence`, call the real changeset with `Decimal.new("NaN")`, `Decimal.new("Infinity")`, and `Decimal.new("-Infinity")`; assert the changeset is invalid and the exact field has an error.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
mix test test/product_compare/repo/captured_numeric_evidence_constraints_test.exs
```

Expected: the new cases raise `ArgumentError` from `Ecto.Changeset.cast/3`.

- [ ] **Step 3: Add the minimal normalization calls**

Include `:percentage_drop` in both `PriceWatchRule` normalization lists. Normalize `:confidence` before `cast/3` in `ProductAttributeClaim.changeset/2` and `ProductTaxon.changeset/2`. Retain the existing validators, mappings, and messages.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run the Task 2 command again and require zero failures.

### Task 3: Exercise The Nine Metadata-Only Checks In PostgreSQL

**Files:**

- Modify: `test/product_compare/repo/check_constraint_error_mapping_test.exs`

**Interfaces:**

- Consumes: the existing eleven fixed-scope mapping assertions and normal repository fixtures.
- Produces: exact `Postgrex.Error` constraint-name assertions for the nine checks without direct database coverage.

- [ ] **Step 1: Add failing direct-write tests**

Use `ProductCompare.DataCase` and real fixtures or valid seed rows. Execute raw inserts or updates that violate exactly these checks and assert `{:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: name}}}`:

```text
category_mapping_candidates_observation_count_positive
claim_dependencies_not_self
community_reports_one_target
ingestion_runs_offers_deactivated_non_negative
product_media_position_non_negative
product_reviews_rating_range
product_taxons_confidence_range
saved_comparison_items_position_range
taxon_closure_depth_nonnegative
```

Include valid parent rows so no foreign key, required-column, or unrelated check can satisfy an assertion first.

- [ ] **Step 2: Prove the tests detect missing database enforcement**

For each new case, first run its equivalent valid control and then the invalid write. Verify the invalid assertion observes the exact named PostgreSQL check, not an Ecto validation or a different constraint.

- [ ] **Step 3: Run the focused suite**

Run:

```bash
mix test test/product_compare/repo/check_constraint_error_mapping_test.exs
```

Expected: every valid control succeeds and all nine invalid writes report their exact checks.

### Task 4: Verify And Commit The Review Fixes

**Files:**

- Modify: `docs/work/database-constraint-application-parity.md`
- Modify: the Task 1-3 files above

**Interfaces:**

- Consumes: all three green milestones.
- Produces: one verified review-fix commit and truthful lane evidence.

- [ ] **Step 1: Run the combined affected boundary**

```bash
mix test test/product_compare/discussions/thread_post_validation_test.exs test/product_compare/repo/captured_numeric_evidence_constraints_test.exs test/product_compare/repo/check_constraint_error_mapping_test.exs test/product_compare/alerts/alerts_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs test/product_compare/taxonomy/taxon_closure_test.exs test/product_compare/taxonomy/use_case_and_guardrail_test.exs
```

- [ ] **Step 2: Run repository gates**

```bash
mix test
mix typecheck
mix quality
mix format --check-formatted
mix work_queue.validate
git diff --check
```

- [ ] **Step 3: Record evidence and commit**

Update the completed lane with the deadlock, Decimal, and direct-database verification evidence. Stage only this plan, the focused production/test changes, and the lane evidence, then commit:

```bash
git commit -m "fix: close constraint parity review gaps"
```
