# Backend GraphQL Node ID Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move root-node Relay ID local-value kind dispatch into `ProductCompareWeb.GraphQL.GlobalId`.

**Architecture:** `GlobalId` already owns global ID parsing plus integer and UUID local-value validation. This batch adds a small helper that accepts integer-backed and UUID-backed type sets, returning a parsed `{type, local_id}` tuple or the existing resolver error atoms so `NodeResolver` can focus on authorization and record lookup.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/global_id.ex`: shared GraphQL global ID parsing and local-value validation.
- `lib/product_compare_web/resolvers/node_resolver.ex`: root `node(id:)` resolver authorization and record lookup.
- `test/product_compare_web/graphql/global_id_test.exs`: focused global ID helper coverage.
- `test/product_compare_web/graphql/node_query_test.exs`: request-level node contract coverage.
- `docs/work/backend-graphql-node-id-helper.md`: source-of-truth work record for this batch.

## Task 1: Root Node ID Helper

**Files:**
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `test/product_compare_web/graphql/global_id_test.exs`
- Verify: `test/product_compare_web/graphql/node_query_test.exs`
- Create: `docs/work/backend-graphql-node-id-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the shared helper decodes integer-backed node IDs, decodes UUID-backed node IDs, returns `{:error, :unsupported_type}` for known-but-not-enabled types, and returns `{:error, :invalid_id}` for malformed local IDs.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs
```

Expected: FAIL because the shared root-node ID helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `GlobalId.decode_typed_local_id/3` that delegates to `decode/1`, `decode_integer/2`, and `decode_uuid/2` while preserving `:invalid_id` and `:unsupported_type` outcomes.

- [x] **Step 4: Replace resolver-local dispatch**

Use `GlobalId.decode_typed_local_id/3` in `NodeResolver.decode_node_id/1` with the existing public/authenticated integer-backed type lists and owner-scoped UUID-backed type list.

- [x] **Step 5: Run focused node verification**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs
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
