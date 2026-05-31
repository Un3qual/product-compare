# Backend GraphQL Global ID Field Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Absinthe field resolver global ID wrapping helpers into `ProductCompareWeb.GraphQL.GlobalId`.

**Architecture:** `ProductCompareWeb.GraphQL.GlobalId` already owns Relay global ID local-value normalization and encoding. Schema field resolvers should call shared helpers that return Absinthe-friendly `{:ok, value}` / `{:error, reason}` tuples instead of carrying schema-private wrappers.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/global_id.ex`: shared GraphQL global ID helper.
- `test/product_compare_web/graphql/global_id_test.exs`: focused helper coverage.
- `lib/product_compare_web/schema.ex`: GraphQL object field ID resolvers.
- `docs/work/backend-graphql-global-id-field-helper.md`: source-of-truth work record for this batch.

## Task 1: GraphQL Global ID Field Helper Adoption

**Files:**
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `test/product_compare_web/graphql/global_id_test.exs`
- Modify: `lib/product_compare_web/schema.ex`
- Create: `docs/work/backend-graphql-global-id-field-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `GlobalId.encode_required/2` wraps integer and binary local IDs in `{:ok, global_id}`, rejects unsupported local values as `{:error, "invalid id"}`, and `GlobalId.encode_optional/2` preserves `nil`.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs
```

Expected: FAIL because the new helper functions are not exported yet.

- [x] **Step 3: Implement shared field resolver helpers**

Add `encode_required/2` and `encode_optional/2` to `ProductCompareWeb.GraphQL.GlobalId`.

- [x] **Step 4: Replace schema-local global ID wrapper helpers**

Update `ProductCompareWeb.Schema` field resolvers to call the shared helpers and remove the private `encode_required_global_id/2` and `encode_optional_global_id/2` functions.

- [x] **Step 5: Run focused GraphQL ID verification**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs
```

Expected: PASS.

- [x] **Step 6: Run final verification**

Run:

```bash
cd assets && bun run check
mix test
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
