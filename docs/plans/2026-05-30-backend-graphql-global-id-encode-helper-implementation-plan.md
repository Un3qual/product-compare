# Backend GraphQL Global ID Encode Helper Implementation Plan

> **For agentic workers:** This was a narrow review-driven cleanup selected after the active backend/frontend queues were complete. Use this plan as the implementation record, not as an ongoing queued batch.

**Goal:** Let `ProductCompareWeb.GraphQL.GlobalId` encode integer local IDs directly so schema, resolver, and test callers do not repeat caller-side `Integer.to_string/1` conversions.

**Architecture:** `GlobalId` owns the schema's global ID local-value normalization. Callers pass the local ID they already have; `GlobalId.encode/2` handles integer-to-string conversion and preserves existing binary ID support for entropy-backed IDs.

**Tech Stack:** Phoenix, Absinthe GraphQL, ExUnit.

---

## File Structure

- `lib/product_compare_web/graphql/global_id.ex`: shared GraphQL global ID encode/decode helpers.
- `lib/product_compare_web/schema.ex`: GraphQL object ID field resolvers.
- `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`: revenue summary filter ID echoing.
- `test/support/conn_case.ex`: request-test Relay ID helper.
- `test/product_compare_web/graphql/global_id_test.exs`: focused shared helper coverage.
- `docs/work/backend-graphql-global-id-encode-helper.md`: source-of-truth work record for the completed cleanup.

## Task 1: Integer-Friendly Global ID Encoding

**Files:**
- Modify: `lib/product_compare_web/graphql/global_id.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`
- Modify: `test/support/conn_case.ex`
- Modify: `test/product_compare_web/graphql/global_id_test.exs`
- Modify: `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- Create: `docs/work/backend-graphql-global-id-encode-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/work/graphql-relay-contract-hardening.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing integer encode coverage**

Add focused `GlobalId.encode/2` coverage proving an integer local ID encodes the same global ID as the equivalent binary local ID.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs
```

Expected: FAIL because `GlobalId.encode/2` only accepts binary local IDs.

- [x] **Step 3: Add integer local-ID support**

Add an integer clause that delegates to the existing binary clause after `Integer.to_string/1`.

- [x] **Step 4: Remove caller-side encode conversions**

Update schema ID helpers, commerce attribution ID echoing, ConnCase `relay_id/2`, and remaining request tests to pass integer IDs directly to `GlobalId.encode/2`.

- [x] **Step 5: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs
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
