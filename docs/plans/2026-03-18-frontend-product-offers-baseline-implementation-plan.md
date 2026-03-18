# Frontend Product Offers Baseline Implementation Plan

> Architecture baseline note (2026-03-18): the repo still does not contain `ARCHITECTURE.md`, so this rebaseline uses `docs/plans/2026-03-05-frontend-fullstack-design.md` plus the current frontend/backend code as the active architecture source.
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `/products/:slug` with a narrow active-offers section backed by the existing GraphQL pricing surface.

**Architecture:** Keep this slice frontend-only. Reuse the existing product-detail route loader, fetch the current product by slug first, then query the existing `merchantProducts(input:)` connection for active offers using the returned product global ID. Defer price-history charts, coupon rendering, merchant filtering UI, compare actions, and Relay compiler adoption to later slices.

**Tech Stack:** Bun, React 19, React Router v7 SSR, TypeScript, Vitest, Phoenix GraphQL.

---

## Progress

- [x] Product-detail loader fetches active merchant offers and renders the success state.
- [x] Offer empty/unavailable states and slice verification committed.

### Task 1: Add active offers to the product-detail loader and route

**Files:**
- Modify: `assets/src/routes/products/api.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`

**Step 1: Write the failing loader and route tests**

Extend the detail-route test to require a second GraphQL request for active merchant products after the product lookup succeeds, and assert the route renders an `Active offers` section with merchant name, offer link, and latest price text.

```tsx
expect(fetchGraphQLMock).toHaveBeenNthCalledWith(
  2,
  expect.stringContaining("query ProductOffers"),
  {
    input: {
      productId: "UHJvZHVjdDox",
      activeOnly: true,
      first: 6
    }
  },
  undefined
);

expect(screen.getByRole("heading", { name: "Active offers" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
  "href",
  "https://merchant.example.com/detail-product"
);
expect(screen.getByText("199.99 USD")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: FAIL because the loader does not yet fetch offers and the route does not render an offers section.

**Step 3: Write the minimal offers implementation**

Add a second route-local GraphQL query for `merchantProducts(input:)`, scoped to the current product global ID with `activeOnly: true` and a small page size. Extend the loader data with a typed `offers` array and route-local `offersStatus`, then render a terse offers section when offers are present.

```ts
const PRODUCT_OFFERS_QUERY = `
  query ProductOffers($input: MerchantProductsInput!) {
    merchantProducts(input: $input) {
      edges {
        node {
          id
          url
          currency
          merchant {
            id
            name
          }
          latestPrice {
            id
            price
          }
        }
      }
    }
  }
`;
```

```tsx
<section aria-label="Active offers">
  <h2>Active offers</h2>
  <ul>
    {offers.map((offer) => (
      <li key={offer.id}>
        <a href={offer.url}>{offer.merchantName}</a>
        <p>{offer.priceText}</p>
      </li>
    ))}
  </ul>
</section>
```

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/products/api.ts assets/src/routes/products/detail.tsx assets/src/routes/products/__tests__/detail.route.test.tsx
git commit -m "feat(frontend): add product detail offers baseline"
```

### Task 2: Add empty and unavailable offer states without breaking detail-state handling

**Files:**
- Modify: `assets/src/routes/products/api.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`

**Step 1: Write the failing offer-state tests**

Add one test for an empty `merchantProducts.edges` response and one test for an offer-query failure after the product detail query succeeds.

```tsx
expect(screen.getByText("No active offers yet.")).toBeInTheDocument();
expect(screen.getByText("Offers unavailable.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: FAIL because the route does not yet distinguish ready, empty, and unavailable offer states.

**Step 3: Write the minimal offer-state handling**

Keep the existing product-level `ready`/`not_found`/`error` states intact, but add a separate `offersStatus` so a failed offers query does not collapse the entire page into `Product unavailable.`.

```ts
type OffersStatus = "ready" | "empty" | "error";
```

```tsx
if (offersStatus === "empty") {
  return <p>No active offers yet.</p>;
}

if (offersStatus === "error") {
  return <p>Offers unavailable.</p>;
}
```

**Step 4: Run the focused route verification**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: PASS.

**Step 5: Run the slice verification**

Run: `mix test test/product_compare_web/graphql/pricing_queries_test.exs`
Expected: PASS.

Run: `cd assets && bun run typecheck && bun run test:unit`
Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/products/api.ts assets/src/routes/products/detail.tsx assets/src/routes/products/__tests__/detail.route.test.tsx
git commit -m "test(frontend): cover product detail offer states"
```
