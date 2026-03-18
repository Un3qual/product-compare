# Frontend Product Detail Baseline Implementation Plan

> Architecture baseline note (2026-03-17): the repo does not currently contain `ARCHITECTURE.md`, so this rebaseline uses `docs/plans/2026-03-05-frontend-fullstack-design.md` plus the current frontend/backend code as the active architecture source.
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the next post-browse frontend slice: a `/products/:slug` route that SSR-renders basic product details from GraphQL and gives each catalog row a stable destination.

**Architecture:** Rebaseline the older fullstack frontend plan to the code that exists today. Keep this slice narrow: add one backend single-product GraphQL query, one route-local frontend loader, and terse detail fallback states. Defer specs tables, price-history charts, coupons, compare state, and Relay compiler adoption to later slices.

**Tech Stack:** Bun, React 19, React Router v7 SSR, TypeScript, Vitest, Phoenix GraphQL.

---

## Progress

- [x] Single-product GraphQL query and regression coverage committed.
- [x] Product-detail route loader, shell, and browse links committed.
- [x] Missing/unavailable-state coverage and slice verification committed.

### Task 1: Add a single-product GraphQL query by slug

**Files:**
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`

**Step 1: Write the failing GraphQL test**

Add a focused query test that asks for one product by slug and asserts the current frontend-visible fields.

```elixir
test "product returns a single product by slug", %{conn: conn} do
  SpecsFixtures.product_fixture(%{slug: "detail-product", name: "Detail Product"})

  assert %{
           "data" => %{
             "product" => %{
               "slug" => "detail-product",
               "name" => "Detail Product"
             }
           }
         } = graphql(conn, product_query(), %{"slug" => "detail-product"})
end
```

**Step 2: Run the test to verify failure**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
Expected: FAIL because the schema does not expose a single-product query yet.

**Step 3: Write the minimal query path**

Expose `product(slug: String!)` on the schema, add a resolver that preloads `brand`, and add a narrow catalog helper for slug lookup.

```elixir
field :product, :product do
  arg(:slug, non_null(:string))

  resolve(&CatalogResolver.product/3)
end
```

Return `{:ok, nil}` when the slug is missing so the frontend can render a route-local not-found state.

**Step 4: Run the test to verify it passes**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare/catalog.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/catalog_queries_test.exs
git commit -m "feat(graphql): add product detail query by slug"
```

### Task 2: Add the frontend product-detail route shell and loader

**Files:**
- Create: `assets/src/routes/products/api.ts`
- Create: `assets/src/routes/products/detail.tsx`
- Create: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`

**Step 1: Write the failing route tests**

Add one detail-route test that stubs the GraphQL response for a slug and asserts the route renders product name, brand, and description. Update the browse-route test so each product row links to `/products/:slug`.

```tsx
expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Catalog First" })).toHaveAttribute(
  "href",
  "/products/catalog-first"
);
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`
Expected: FAIL because the detail route, loader, and browse links do not exist yet.

**Step 3: Write the minimal route and loader**

Create a route-local loader that queries the new GraphQL `product(slug:)` field and returns typed loader data for a `/products/:slug` route.

```ts
export async function productDetailLoader({ params, request }: LoaderFunctionArgs) {
  return loadProductDetail(params.slug ?? "", typeof window === "undefined" ? { request } : undefined);
}
```

Render a narrow route shell with the product heading, brand line, and description copy. Link browse product names to the new detail route.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/products assets/src/router.tsx assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/__tests__/browse.route.test.tsx
git commit -m "feat(frontend): add product detail route baseline"
```

### Task 3: Add missing and unavailable states for the detail route

**Files:**
- Modify: `assets/src/routes/products/api.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`

**Step 1: Write the failing state tests**

Add one test for a `null` product payload and one test for a rejected GraphQL request.

```tsx
expect(screen.getByText("Product not found.")).toBeInTheDocument();
expect(screen.getByText("Product unavailable.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: FAIL because the route does not yet handle missing or failed detail loads.

**Step 3: Write the minimal state handling**

Return a route-local status from the loader so the route can distinguish ready, missing, and unavailable states without introducing an error boundary in this slice.

```tsx
if (status === "not_found") {
  return <p>Product not found.</p>;
}

if (status === "error") {
  return <p>Product unavailable.</p>;
}
```

**Step 4: Run the focused route verification**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`
Expected: PASS.

**Step 5: Run the slice verification**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
Expected: PASS.

Run: `cd assets && bun run typecheck && bun run test:unit`
Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/products/api.ts assets/src/routes/products/detail.tsx assets/src/routes/products/__tests__/detail.route.test.tsx
git commit -m "test(frontend): cover product detail route states"
```
