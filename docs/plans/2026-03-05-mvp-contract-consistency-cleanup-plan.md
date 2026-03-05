# MVP Contract Consistency Cleanup Implementation Plan

**Goal:** Align existing schema/context contracts with current database and API intent so baseline MVP workflows remain predictable and ingest-ready without adding deferred features.

**Architecture:** Apply narrowly scoped, backward-compatible fixes in existing context/schema modules. Prefer contract alignment over introducing new infrastructure: update validations to match persisted schema intent, remove dead fields from upsert logic, and lock behavior with regression tests.

**Tech Stack:** Elixir, Ecto, Phoenix, ExUnit

---

## Scope

- In scope:
  - Tighten `source_artifacts.source_id` ownership constraint in DB and schema behavior.
  - Add guard test coverage proving `source_id` is required by changeset.
  - Affiliate network upsert dead-field cleanup (`homepage_url` update path without schema/input support).
  - Regression tests + verification.
- Out of scope:
  - Oban/scheduling and ingest workers.
  - New provider integrations.
  - New GraphQL feature surfaces.

## Execution Checklist

- [x] Task 1: Source-artifact DB constraint tightening + regression tests.
- [x] Task 2: Affiliate network upsert dead-field cleanup.
- [x] Task 3: Verification and milestone commit.

## Task 1: Source-Artifact DB Constraint Tightening + Regression Tests

**Files:**
- Create: `priv/repo/migrations/<timestamp>_tighten_source_artifacts_source_fk.exs`
- Modify: `lib/product_compare_schemas/specs/source_artifact.ex`
- Create: `test/product_compare/specs/source_artifact_changeset_test.exs`

### Step 1: Write the failing test

Create `source_artifact_changeset_test.exs` with tests asserting:
- `source_id` is required.
- `fetched_at` is required.

```elixir
test "requires source_id and fetched_at" do
  changeset = SourceArtifact.changeset(%SourceArtifact{}, %{})

  refute changeset.valid?
  assert "can't be blank" in errors_on(changeset).source_id
  assert "can't be blank" in errors_on(changeset).fetched_at
end
```

### Step 2: Run test to verify it fails

Run:

```bash
mix test test/product_compare/specs/source_artifact_changeset_test.exs
```

Expected: failure because the test file is new and behavior is not yet locked.

### Step 3: Write minimal implementation

1. Add migration to enforce DB ownership semantics:
   - fail fast if any `source_artifacts.source_id` is NULL.
   - modify `source_id` to `null: false`.
   - change FK delete behavior from `:nilify_all` to `:delete_all`.
2. Keep `SourceArtifact.changeset/2` requiring both `source_id` and `fetched_at`.
3. Add/adjust tests to assert required fields.

### Step 4: Run test to verify it passes

Run:

```bash
mix test test/product_compare/specs/source_artifact_changeset_test.exs
```

Expected: new source-artifact changeset tests pass.

### Step 5: Commit

```bash
git add priv/repo/migrations/<timestamp>_tighten_source_artifacts_source_fk.exs \
  lib/product_compare_schemas/specs/source_artifact.ex \
  test/product_compare/specs/source_artifact_changeset_test.exs
git commit -m "fix: tighten source artifact ownership constraints"
```

## Task 2: Affiliate Network Upsert Dead-Field Cleanup

**Files:**
- Modify: `lib/product_compare/affiliate.ex`
- Test: `test/product_compare/affiliate/affiliate_workflows_test.exs`

### Step 1: Write/adjust regression test (if needed)

Confirm existing `upsert_network/1` test in `affiliate_workflows_test.exs` proves upsert behavior remains stable. Add explicit assertion on persisted fields if needed (no new schema fields introduced).

### Step 2: Run test baseline

Run:

```bash
mix test test/product_compare/affiliate/affiliate_workflows_test.exs
```

Expected: current test passes before cleanup.

### Step 3: Write minimal implementation

In `Affiliate.upsert_network/1`:
- remove dead `:homepage_url` update projection.
- use empty conflict update list plus `updated_at`, or explicitly update only known mutable columns currently supported (`name` is conflict key, so only `updated_at` is expected).

Target behavior:
- repeated upserts by `name` stay idempotent.
- no references to unsupported fields.

### Step 4: Run test to verify no behavioral regression

Run:

```bash
mix test test/product_compare/affiliate/affiliate_workflows_test.exs
```

Expected: test remains green.

### Step 5: Commit

```bash
git add lib/product_compare/affiliate.ex test/product_compare/affiliate/affiliate_workflows_test.exs
git commit -m "refactor: remove dead affiliate network upsert field mapping"
```

## Task 3: Verification And Milestone Commit

**Files:**
- Modify: `docs/implementation-checklist.md` (only if adding a checkpoint line is warranted)

### Step 1: Run full verification gate

Run:

```bash
mix test
mix precommit
```

Expected: all tests pass with no new warnings/errors.

### Step 2: Update checklist progress

If maintaining a checkpoint entry, add one concise line under verification noting contract-consistency cleanup completed with passing verification.

### Step 3: Milestone commit

Bundle all code + tests (+ checklist update if used):

```bash
git add priv/repo/migrations/<timestamp>_tighten_source_artifacts_source_fk.exs \
  lib/product_compare_schemas/specs/source_artifact.ex \
  lib/product_compare/affiliate.ex \
  test/product_compare/specs/source_artifact_changeset_test.exs \
  test/product_compare/affiliate/affiliate_workflows_test.exs \
  docs/implementation-checklist.md
git commit -m "fix: align mvp schema contracts and remove dead affiliate upsert mapping"
```

## Risks / Notes

- `merchants.domain` was already tightened by `20260304143500_replace_partial_merchant_domain_index.exs`; this plan does not duplicate that migration.
- Source-artifact ownership is tightened in DB and schema to avoid mixed semantics.

## Rollback Plan

- Revert this batch commit.
- Restore previous required validations.
- Remove the new regression test file if no longer aligned to intended schema semantics.
