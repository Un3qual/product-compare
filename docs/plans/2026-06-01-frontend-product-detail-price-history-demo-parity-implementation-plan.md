# Frontend Product Detail Price History Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a compact price-history baseline for each active product-detail offer.

**Architecture:** Reuse the existing product detail offers preload and backend `MerchantProduct.priceHistory(first:, after:, from:, to:)` field. Refresh the local frontend schema snapshot, extend `ProductOffersRouteQuery`, and render bounded chronological history rows under each active offer without adding a new route or backend field.

**Tech Stack:** React Router loaders, React Relay, TypeScript, Vitest, Testing Library, Phoenix Absinthe GraphQL.

---

## Existing Contract

- `/products/:slug` already preloads the product query and a separate `ProductOffersRouteQuery` by product global ID.
- `ProductOffersRouteQuery` currently reads active merchant offers with merchant, latest price, and active coupons.
- Backend GraphQL already exposes `MerchantProduct.priceHistory(first:, after:, from:, to:)` and `PricePoint.observedAt`; `test/product_compare_web/graphql/pricing_queries_test.exs` covers filtering and cursor behavior.
- `assets/schema.graphql` is stale for this slice: it has `PricePoint.id`, `PricePoint.merchantProductId`, and `PricePoint.price`, but not `PricePoint.observedAt`, `PricePointConnection`, `PricePointEdge`, or `MerchantProduct.priceHistory`.

## File Structure

- Modify `assets/src/routes/products/__tests__/detail.route.test.tsx` for route-level RED coverage.
- Modify `assets/schema.graphql` to mirror the existing backend price-history GraphQL contract.
- Modify `assets/src/routes/products/queries/ProductOffersRouteQuery.ts` to request `priceHistory(first: 3)`.
- Regenerate `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`.
- Modify `assets/src/routes/products/detail.tsx` to render price-history rows and empty history states.
- Update `docs/work/frontend-product-detail-price-history-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the closing milestone.

---

### Task 1: Refresh The Frontend Price-History Contract And Render Rows

**Files:**
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Modify: `assets/schema.graphql`
- Modify: `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- Modify generated: `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify after verification: `docs/work/frontend-product-detail-price-history-demo-parity.md`
- Modify after verification: `docs/plans/2026-06-01-frontend-product-detail-price-history-demo-parity-implementation-plan.md`

- [x] **Step 1: Write failing route tests**

Add route coverage for price-history rows under an active offer and for an active offer with no history rows. Use stable ISO-date display so the test is not locale-dependent:

```tsx
test("renders active offer price history rows", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: { status: "ready", query: OFFERS_QUERY_DESCRIPTOR }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(
    buildOffersData([
      {
        id: "merchant-product-1",
        url: "https://merchant.example.com/detail-product",
        currency: "USD",
        merchant: { id: "merchant-1", name: "Acme" },
        latestPrice: { id: "price-3", price: "199.99" },
        activeCoupons: { edges: [] },
        priceHistory: {
          edges: [
            { node: { id: "price-1", price: "249.99", observedAt: "2026-05-30T10:00:00Z" } },
            { node: { id: "price-2", price: "229.99", observedAt: "2026-05-31T10:00:00Z" } }
          ],
          pageInfo: { hasNextPage: true }
        }
      }
    ])
  );

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  const offerItem = screen.getByRole("link", { name: "Acme" }).closest("li");

  expect(offerItem).not.toBeNull();
  expect(within(offerItem as HTMLElement).getByRole("list", { name: "Acme price history" })).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("2026-05-30")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("249.99 USD")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("2026-05-31")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("229.99 USD")).toBeVisible();
  expect(within(offerItem as HTMLElement).getByText("More price history available.")).toBeVisible();
});
```

Also add an empty state test that expects `No price history for this offer yet.` while preserving the existing latest-price text.

- [x] **Step 2: Run the route test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
```

Expected: FAIL because the route does not read or render `priceHistory` yet.

Observed 2026-06-01: FAIL with 2 expected failures. The route did not render the `Acme price history` list or `No price history for this offer yet.`.

- [x] **Step 3: Refresh the schema snapshot and Relay query**

Update `assets/schema.graphql` with the existing backend contract:

```graphql
type MerchantProduct implements Node {
  priceHistory(first: Int, after: String, from: DateTime, to: DateTime): PricePointConnection
}

type PricePoint {
  id: ID!
  merchantProductId: ID!
  observedAt: DateTime!
  price: Decimal!
}

type PricePointConnection {
  edges: [PricePointEdge!]!
  pageInfo: PageInfo!
}

type PricePointEdge {
  node: PricePoint!
  cursor: String!
}
```

Then extend `ProductOffersRouteQuery`:

```tsx
priceHistory(first: 3) {
  edges {
    node {
      id
      price
      observedAt
    }
  }
  pageInfo {
    hasNextPage
  }
}
```

- [x] **Step 4: Render the price-history baseline**

In `ProductOffers`, build rows from `node.priceHistory?.edges ?? []` and render them below the latest price and above coupon rows. Keep latest price rendering unchanged.

Use helpers with stable output:

```tsx
function formatObservedDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}
```

Render an accessible nested list:

```tsx
function OfferPriceHistory({ merchantName, historyRows, hasMore }: OfferPriceHistoryProps) {
  if (historyRows.length === 0) {
    return <p>No price history for this offer yet.</p>;
  }

  return (
    <section>
      <h3>Price history</h3>
      <ul aria-label={`${merchantName} price history`}>
        {historyRows.map((row) => (
          <li key={row.id}>
            <time dateTime={row.observedAt}>{row.observedDate}</time>
            <span>{row.priceText}</span>
          </li>
        ))}
      </ul>
      {hasMore ? <p>More price history available.</p> : null}
    </section>
  );
}
```

- [x] **Step 5: Generate Relay artifacts and verify**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

Observed 2026-06-01: PASS. `bun run relay` completed, `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` passed 21 tests, and `bun run typecheck` completed with `tsc --noEmit`.

- [x] **Step 6: Update queue docs**

Mark Task 1 complete, record RED/GREEN verification, and advance the current batch to Task 2.

Observed 2026-06-01: Updated only the frontend lane work doc and this implementation plan for Task 1 completion and Task 2 handoff; coordinator-owned docs were left unchanged for the integration boundary.

---

### Task 2: Run Demo-Slice Verification And Close The Lane

**Files:**
- Modify: `docs/work/frontend-product-detail-price-history-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [x] **Step 1: Run focused verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
cd assets && bun run typecheck
mix test test/product_compare_web/graphql/pricing_queries_test.exs
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

Record final verification, mark the lane completed, remove it from the active unblocked frontend queue, and update architecture/current-plan docs to show product detail price-history display as delivered.
