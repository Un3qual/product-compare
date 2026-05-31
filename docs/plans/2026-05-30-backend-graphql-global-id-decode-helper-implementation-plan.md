# Backend GraphQL Global ID Decode Helper Implementation Plan

> **For agentic workers:** This was a narrow review-driven cleanup selected after the active backend/frontend queues were complete. Use this plan as the implementation record, not as an ongoing queued batch.

**Goal:** Centralize GraphQL global ID integer and UUID decoding in `ProductCompareWeb.GraphQL.GlobalId` so resolvers do not duplicate type checks, integer parsing, UUID casting, and database ID bounds.

**Architecture:** `GlobalId` owns the schema's encode/decode contract. Resolver modules may still choose their own error payload shape, but should delegate local-ID parsing and validation to `GlobalId.decode_integer/2` or `GlobalId.decode_uuid/2`.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/global_id.ex`: shared GraphQL global ID encode/decode helpers.
- `lib/product_compare_web/resolvers/*.ex`: resolver input normalization that consumes global IDs.
- `test/product_compare_web/graphql/global_id_test.exs`: focused shared helper coverage.
- `docs/work/backend-graphql-global-id-decode-helper.md`: source-of-truth work record for the completed cleanup.

## Task 1: Shared Global ID Decode Helpers

**Files:**
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `lib/product_compare_web/resolvers/auth_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Create: `test/product_compare_web/graphql/global_id_test.exs`
- Create: `docs/work/backend-graphql-global-id-decode-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/work/graphql-relay-contract-hardening.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing shared helper coverage**

Add focused `GlobalId` coverage for positive integer IDs, expected type mismatches, non-positive IDs, non-integer IDs, out-of-range database IDs, UUID IDs, wrong UUID-backed types, and invalid UUID local IDs.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs
```

Expected: FAIL because `decode_integer/2` and `decode_uuid/2` do not exist.

- [x] **Step 3: Add shared decode helpers**

Implement `GlobalId.decode_integer/2` with a positive PostgreSQL bigint bound and `GlobalId.decode_uuid/2` with `Ecto.UUID.cast/1`.

- [x] **Step 4: Replace resolver-local parsing**

Update auth, catalog, pricing, affiliate, commerce attribution, and node resolver ID normalization to use the shared helpers while preserving each resolver's existing error shape.

- [x] **Step 5: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs
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
