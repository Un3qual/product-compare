# Frontend Product Detail Coupon Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render active, shopper-facing coupons on the Relay-backed product detail route.

**Architecture:** Keep the existing authenticated affiliate setup and top-level `activeCoupons(input:)` contract intact. Add a public, display-scoped nested coupon field under `MerchantProduct` so `/products/:slug` can load coupons for each active offer in the existing product-offers query without per-merchant client follow-up requests or exposing authenticated affiliate management fields. The frontend then renders the returned coupon display fields inside the existing Active offers section.

**Tech Stack:** Phoenix Absinthe GraphQL, existing Affiliate/Pricing contexts, React Router loaders, React Relay, Bun, Vitest, Testing Library.

---

## Existing Contract

- Product detail currently preloads `ProductDetailRouteQuery` by slug and a separate `ProductOffersRouteQuery` by product global ID.
- `ProductOffersRouteQuery` reads `merchantProducts(input: { productId:, activeOnly: true })`, including merchant name and latest price.
- The backend already stores coupons through `ProductCompare.Affiliate.create_coupon/1` and lists active merchant coupons through `ProductCompare.Affiliate.list_active_coupons_query/2`.
- The existing top-level `activeCoupons(input:)` query requires authentication and should remain unchanged for affiliate workflow management.
- Product detail is public, so this lane must expose only shopper-facing display fields from coupons, not management-only IDs such as affiliate network IDs or source artifact IDs.

## File Structure

- Modify `lib/product_compare_web/schema.ex` to add display-scoped active coupon connection types and a nested `MerchantProduct.activeCoupons(first:, after:, at:)` field.
- Modify `lib/product_compare_web/resolvers/affiliate_resolver.ex` to resolve nested active coupons from the merchant product's merchant ID without requiring session auth.
- Add backend contract coverage to `test/product_compare_web/graphql/pricing_queries_test.exs`.
- Modify `assets/src/routes/products/queries/ProductOffersRouteQuery.ts` to request active coupon display fields for each offer.
- Modify `assets/src/routes/products/detail.tsx` to render coupon codes, descriptions, discount text, terms, and empty states inside active offers.
- Modify `assets/src/routes/products/__tests__/detail.route.test.tsx` for route rendering coverage.
- Refresh `assets/schema.graphql` and generated Relay artifacts under `assets/src/__generated__/**`.
- Update `docs/work/frontend-product-detail-coupon-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at milestone boundaries.

---

### Task 1: Add Public Display Coupons To Product Offers GraphQL

**Files:**
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/affiliate_resolver.ex`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Modify after verification: `docs/work/frontend-product-detail-coupon-demo-parity.md`
- Modify after verification: `docs/work/index.md`
- Modify after verification: `docs/plans/NOW.md`
- Modify after verification: `docs/plans/INDEX.md`

- [x] **Step 1: Write the failing GraphQL test**

Add a pricing GraphQL test that creates one product, one active merchant product, active coupons for that merchant, and inactive/future coupons that must not render. Query `merchantProducts` as an anonymous request and assert nested `activeCoupons(first: 2)` returns only display fields:

```graphql
query MerchantProductActiveCoupons($input: MerchantProductsInput!, $couponFirst: Int!) {
  merchantProducts(input: $input) {
    edges {
      node {
        id
        merchant {
          name
        }
        activeCoupons(first: $couponFirst) {
          edges {
            node {
              code
              description
              discountType
              discountValue
              currency
              validTo
              terms
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
  }
}
```

- [x] **Step 2: Run the backend test to verify it fails**

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: FAIL because `MerchantProduct.activeCoupons` and the display coupon types do not exist yet.

- [x] **Step 3: Add the display-scoped GraphQL field**

Add `MerchantProduct.activeCoupons(first:, after:, at:)` returning a new display-only connection. The display node must include `code`, `description`, `discountType`, `discountValue`, `currency`, `validTo`, and `terms`; it must not expose affiliate network IDs, source artifact IDs, coupon global IDs, or management timestamps.

- [x] **Step 4: Add the nested resolver**

Add a resolver that uses the parent merchant product's `merchant_id`, defaults `at` to `DateTime.utc_now()`, uses `Input.connection_args/1`, and delegates pagination to `Connection.from_query_result/3` over `Affiliate.list_active_coupons_query/2`.

- [x] **Step 5: Run focused backend verification**

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs
```

Expected: PASS.

- [x] **Step 6: Update queue docs**

Mark Task 1 complete, record the focused verification, and advance the current batch to Task 2.

---

### Task 2: Render Active Coupons On Product Detail Offers

**Files:**
- Modify: `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Modify generated: `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- Modify: `assets/schema.graphql`
- Modify after verification: `docs/work/frontend-product-detail-coupon-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [x] **Step 1: Write failing route tests**

Extend product detail route coverage so an active offer with nested coupon data renders a coupon code, description, formatted discount text, and terms. Add empty nested coupon coverage proving offers still render when a merchant has no active coupons.

- [x] **Step 2: Run the route test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
```

Expected: FAIL because the route query and UI do not read or render nested active coupons.

- [x] **Step 3: Refresh the local schema snapshot and update the Relay query**

Run backend schema export or update `assets/schema.graphql` with the new display coupon connection, then extend `ProductOffersRouteQuery` to request `activeCoupons(first: 2) { ... }` through each active merchant-product offer.

- [x] **Step 4: Render coupon display rows**

Render nested coupons under the matching merchant offer. Format `AMOUNT` as `<value> <currency>`, `PERCENT` as `<value>%`, and omit discount text when the server returns no numeric value. Keep unsafe offer URL filtering intact.

- [x] **Step 5: Generate Relay artifacts and verify**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 6: Update queue docs**

Mark Task 2 complete, record verification, and advance the current batch to Task 3.

---

### Task 3: Run Demo-Slice Verification And Close The Lane

**Files:**
- Modify: `docs/work/frontend-product-detail-coupon-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Run focused backend and frontend verification**

Run:

```bash
mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs
cd assets && bun run relay
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

- [x] **Step 2: Run broader frontend and diff checks**

Run:

```bash
cd assets && bun run check
git diff --check
```

Expected: PASS.

- [x] **Step 3: Close the lane**

Record final verification, mark the lane completed, remove it from the active unblocked queue, and update architecture/current-plan docs to show product detail active coupon display as delivered.
