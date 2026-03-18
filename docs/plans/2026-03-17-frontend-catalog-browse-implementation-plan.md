# Frontend Catalog Browse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the first post-auth frontend discovery slice: a `/products` route that SSR-renders a paginated product list from GraphQL and gives users a stable browse entry point.

**Architecture:** Rebaseline the older frontend plan to the code that already exists today. Keep this slice narrow: use the existing `products` GraphQL connection, route-local data loading, and the current Bun SSR app structure instead of reopening broader frontend or backend scope.

**Tech Stack:** Bun, React 19, React Router v7 SSR, TypeScript, Vitest, Phoenix GraphQL.

---

## Progress

- [ ] Browse route shell and navigation committed.
- [ ] Product-list data loader and typed route rendering committed.
- [ ] Empty/error-state coverage and route regression verification committed.

### Task 1: Add the browse route shell and navigation entry point

**Files:**
- Create: `assets/src/routes/catalog/browse.tsx`
- Create: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Test: `assets/src/routes/__tests__/root.route.test.tsx`

**Step 1: Write the failing route tests**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { BrowseRoute } from "../browse";

test("renders the catalog browse heading", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <BrowseRoute />
    </MemoryRouter>
  );

  expect(html).toContain("Browse products");
});
```

Update the root-route test so it also expects a visible link to `/products`.

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx`
Expected: FAIL because the route file and navigation entry do not exist yet.

**Step 3: Write the minimal route shell**

```tsx
export function BrowseRoute() {
  return (
    <section>
      <h1>Browse products</h1>
      <p>Product discovery will render here.</p>
    </section>
  );
}
```

Add a `/products` route in `assets/src/router.tsx` and link to it from the root route.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/__tests__/root.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/catalog assets/src/router.tsx assets/src/routes/root.tsx
git commit -m "feat(frontend): add catalog browse route shell"
```

### Task 2: Add a typed products loader for the browse route

**Files:**
- Create: `assets/src/routes/catalog/api.ts`
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Test: `assets/src/relay/__tests__/fetch-graphql.test.ts`

**Step 1: Write the failing data test**

Add a browse-route test that stubs `fetch` and expects the route to render product names returned from the existing GraphQL `products(first: 12)` connection.

```tsx
expect(screen.getByText("Catalog First")).toBeInTheDocument();
expect(screen.getByText("Catalog Second")).toBeInTheDocument();
```

Add a focused API test if needed for a helper like `loadBrowseProducts()`.

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/relay/__tests__/fetch-graphql.test.ts`
Expected: FAIL because the route still renders only placeholder content.

**Step 3: Write the minimal loader and route rendering**

```ts
export async function loadBrowseProducts() {
  const response = await fetchGraphQL(PRODUCTS_QUERY, { first: 12 });
  return response.data?.products?.edges ?? [];
}
```

Render each edge as a simple list item with product name, slug, and brand name. Keep pagination controls out of this slice.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/relay/__tests__/fetch-graphql.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/catalog/api.ts assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/__tests__/browse.route.test.tsx
git commit -m "feat(frontend): render catalog browse products"
```

### Task 3: Add empty and unavailable states for the browse route

**Files:**
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`

**Step 1: Write the failing state tests**

Add one test for an empty `edges` response and one test for a rejected network request.

```tsx
expect(screen.getByText("No products available yet.")).toBeInTheDocument();
expect(screen.getByText("Catalog unavailable.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
Expected: FAIL because the route does not handle empty or failed fetches yet.

**Step 3: Write the minimal state handling**

```tsx
if (status === "error") {
  return <p>Catalog unavailable.</p>;
}

if (products.length === 0) {
  return <p>No products available yet.</p>;
}
```

Keep copy terse and avoid introducing design-system complexity in this batch.

**Step 4: Run the route-level verification**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
Expected: PASS.

**Step 5: Run the slice verification**

Run: `cd assets && bun run typecheck && bun run test:unit`
Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/__tests__/browse.route.test.tsx
git commit -m "test(frontend): cover catalog browse states"
```
