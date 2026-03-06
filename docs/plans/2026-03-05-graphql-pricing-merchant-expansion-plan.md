# GraphQL Pricing + Merchant Surface Expansion Implementation Plan

> Implement this plan task-by-task using your preferred workflow or automation tooling.

**Goal:** Add the next GraphQL read surface for merchant/merchant-product discovery and price history so clients can resolve IDs and retrieve current/historical pricing without out-of-band lookups.

**Architecture:** Extend the existing GraphQL schema with pricing-focused read queries and object fields while keeping business/data access in `ProductCompare.Pricing`. Use Relay global IDs for all pricing entities and connection-based pagination for list/history responses. Keep error behavior strict and deterministic for invalid IDs/cursors.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, ExUnit

---

## Checklist

- [x] Task 1: Add pricing read APIs in `ProductCompare.Pricing` for GraphQL resolver consumption.
- [x] Task 2: Add GraphQL schema/resolver surface for merchant + merchant-product discovery.
- [ ] Task 3: Add GraphQL pricing history/latest-price fields with strict ID/cursor handling.
- [ ] Task 4: Verification checkpoint + milestone commits + checklist update.

## Task 1: Pricing Context Read APIs

**Files:**
- Modify: `lib/product_compare/pricing.ex`
- Test: `test/product_compare/pricing/pricing_test.exs`

### Step 1: Write failing context tests first

Add tests that cover:
- listing merchants in stable order.
- listing merchant products by `product_id` in stable order.
- optional filtering for active merchant products (`is_active`).
- preloading merchant/product on merchant-product read paths expected by GraphQL.

### Step 2: Run targeted context tests and confirm RED

Run:

```bash
mix test test/product_compare/pricing/pricing_test.exs
```

Expected: new tests fail before API additions.

### Step 3: Implement minimal context APIs

Add in `Pricing`:
- `list_merchants_query/0` and `list_merchants/0`.
- `list_merchant_products_query/1` and `list_merchant_products/1` (supports `product_id`, optional `merchant_id`, optional `active_only`).
- `get_merchant!/1` and `get_merchant_product!/1` with preloads needed for GraphQL field resolution.

Keep deterministic ordering (`id ASC` for list discovery, existing history ordering for price points).

### Step 4: Run targeted tests to GREEN

Run:

```bash
mix test test/product_compare/pricing/pricing_test.exs
```

Expected: pricing context suite passes.

### Step 5: Commit task milestone

```bash
git add lib/product_compare/pricing.ex test/product_compare/pricing/pricing_test.exs
git commit -m "feat: add pricing read APIs for graphql merchant discovery"
```

## Task 2: GraphQL Merchant + Merchant Product Discovery

**Files:**
- Create: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/graphql/global_id.ex` (only if additional pricing ID types are needed)
- Create: `test/product_compare_web/graphql/pricing_queries_test.exs`

### Step 1: Write failing GraphQL tests first

Add tests for:
- `merchants(first, after)` connection query (stable ordering, Relay merchant IDs).
- `merchantProducts(input: ...)` connection query with:
  - required `productId`,
  - optional `merchantId`,
  - optional `activeOnly`,
  - strict invalid cursor behavior.
- rejection of raw integer IDs for `productId`/`merchantId`.

### Step 2: Run targeted GraphQL tests and confirm RED

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: new pricing GraphQL tests fail before schema/resolver implementation.

### Step 3: Implement minimal schema/resolver support

1. Add pricing query fields:
   - `merchants(first, after): MerchantConnection`
   - `merchantProducts(input: MerchantProductsInput!): MerchantProductConnection`
2. Add GraphQL objects/connections:
   - `Merchant`, `MerchantEdge`, `MerchantConnection`
   - `MerchantProduct`, `MerchantProductEdge`, `MerchantProductConnection`
3. Implement resolver using `Pricing` context queries + `Connection.from_query/3`.
4. Decode/validate Relay IDs via `GlobalId.decode/1` for `productId` and `merchantId`.
5. Return deterministic errors for invalid IDs/cursors (`invalid product id`, `invalid merchant id`, `invalid cursor`).

### Step 4: Run targeted GraphQL tests to GREEN

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: discovery query tests pass.

### Step 5: Commit task milestone

```bash
git add \
  lib/product_compare_web/resolvers/pricing_resolver.ex \
  lib/product_compare_web/schema.ex \
  lib/product_compare_web/graphql/global_id.ex \
  test/product_compare_web/graphql/pricing_queries_test.exs
git commit -m "feat: add graphql merchant and merchant-product discovery queries"
```

## Task 3: GraphQL Latest Price + Price History Surface

**Files:**
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/graphql/connection.ex` (only if helper enhancement is required)
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`

### Step 1: Write failing tests first

Add tests for:
- `latestPrice` field on `MerchantProduct`.
- `priceHistory` connection field on `MerchantProduct` supporting:
  - optional `from`/`to`,
  - `first`/`after` cursor paging,
  - stable ordering using existing pricing rules.
- strict invalid cursor behavior on `priceHistory`.

### Step 2: Run targeted test file and confirm RED

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: latest/history tests fail before implementation.

### Step 3: Implement minimal resolver/schema behavior

1. Add `PricePoint`, `PricePointEdge`, `PricePointConnection` types.
2. Expose `latestPrice` and `priceHistory` fields from `MerchantProduct`.
3. Use `Pricing.latest_price/1` and query-backed history path for connection pagination.
4. Keep error semantics strict for cursor parsing failures and invalid arguments.

### Step 4: Run targeted tests to GREEN

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: pricing GraphQL suite passes with history/latest coverage.

### Step 5: Commit task milestone

```bash
git add \
  lib/product_compare_web/resolvers/pricing_resolver.ex \
  lib/product_compare_web/schema.ex \
  lib/product_compare_web/graphql/connection.ex \
  test/product_compare_web/graphql/pricing_queries_test.exs
git commit -m "feat: expose latest-price and price-history graphql fields"
```

## Task 4: Verification + Checklist Update

**Files:**
- Modify: `docs/implementation-checklist.md`
- Modify: `docs/plans/2026-03-05-graphql-pricing-merchant-expansion-plan.md`

### Step 1: Run verification gates

Run:

```bash
mix compile --warnings-as-errors
mix typecheck
mix test
mix precommit
mix ci
```

### Step 2: Update progress/checkpoint docs

1. Mark this plan’s checklist items complete.
2. Add a concise “GraphQL Pricing + Merchant Checkpoint” section to `docs/implementation-checklist.md` with:
   - delivered query/field surface,
   - strict ID/cursor contract confirmations,
   - verification command outcomes.

### Step 3: Final milestone commit (if needed)

Only if verification/doc updates are not already included in prior task milestones:

```bash
git add docs/implementation-checklist.md docs/plans/2026-03-05-graphql-pricing-merchant-expansion-plan.md
git commit -m "docs: record graphql pricing and merchant checkpoint"
```
