# Backend GraphQL Test Global ID Helper Implementation Plan

> **For agentic workers:** This was a narrow review-driven cleanup selected after the active backend/frontend queues were complete. Use this plan as the implementation record, not as an ongoing queued batch.

**Goal:** Make backend GraphQL tests use the application's shared Relay global ID contract instead of duplicating raw Base64 ID construction in each test module.

**Architecture:** Keep GraphQL global ID encoding owned by `ProductCompareWeb.GraphQL.GlobalId`. Expose a small ConnCase test helper so request-level GraphQL tests can construct IDs through the same contract the schema uses, while keeping test call sites compact.

**Tech Stack:** Phoenix ConnCase, Absinthe GraphQL, ExUnit.

---

## File Structure

- `test/support/conn_case.ex`: shared connection-test helpers.
- `test/product_compare_web/conn_case_test.exs`: focused ConnCase helper coverage.
- `test/product_compare_web/graphql/*.exs`: request-level GraphQL tests that assert Relay global IDs.
- `docs/work/backend-graphql-test-global-id-helper.md`: source-of-truth work record for the completed cleanup.

## Task 1: Shared GraphQL Test Global ID Helper

**Files:**
- Modify: `test/support/conn_case.ex`
- Create: `test/product_compare_web/conn_case_test.exs`
- Modify: `test/product_compare_web/graphql/*.exs`
- Create: `docs/work/backend-graphql-test-global-id-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused ConnCase coverage proving `relay_id/2` encodes both integer-backed and entropy-backed GraphQL IDs through `ProductCompareWeb.GraphQL.GlobalId`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/conn_case_test.exs
```

Expected: FAIL because `relay_id/2` is not yet imported by ConnCase-based tests.

- [x] **Step 3: Add the shared ConnCase helper**

Implement `relay_id/2` in `ProductCompareWeb.ConnCase`, accepting a `GlobalId.type()` atom and converting the local ID to a string before calling `GlobalId.encode/2`.

- [x] **Step 4: Migrate GraphQL tests off local Base64 helpers**

Replace stringly `relay_id("Product", id)` calls with atom-based `relay_id(:product, id)` calls and remove duplicated local `Base.encode64(...)` helpers from request-level GraphQL test modules.

- [x] **Step 5: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql
```

Expected: PASS.

- [x] **Step 6: Run final verification**

Run:

```bash
mix format --check-formatted
mix test
mix compile --warnings-as-errors
mix typecheck
cd assets && bun run check
git diff --check
```

Expected: PASS.
