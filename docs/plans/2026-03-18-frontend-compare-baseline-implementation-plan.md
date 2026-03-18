# Frontend Compare Baseline Implementation Plan

> Architecture baseline note (2026-03-18): the repo still does not contain `ARCHITECTURE.md` or `docs/plans/INDEX.md`, so this rebaseline uses `docs/plans/2026-03-05-frontend-fullstack-design.md` plus the current frontend/backend code as the active architecture source.
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the next post-detail frontend slice: an SSR-safe `/compare` route that accepts up to three product slugs in the URL and renders a narrow comparison baseline from existing GraphQL data.

**Architecture:** Keep this slice frontend-first and route-local. Model compare selection as repeated `slug` query params on `/compare`, validate the selection before any data fetches, then reuse the existing `loadProductDetail/2` helper to hydrate up to three comparison cards in URL order. Defer saved-comparison persistence, compare tray/global state, attribute-alignment tables, coupons, and Relay compiler adoption to later slices.

**Tech Stack:** Bun, React 19, React Router v7 SSR, TypeScript, Vitest, Phoenix GraphQL.

---

## Progress

- [x] Compare route shell, root navigation entry, and selection guards committed.
- [x] Compare route ready-state product cards committed.
- [x] Compare route missing/unavailable handling and slice verification committed.

### Task 1: Add the compare route shell, navigation link, and selection guards

**Files:**
- Create: `assets/src/routes/compare/api.ts`
- Create: `assets/src/routes/compare/index.tsx`
- Create: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`

**Step 1: Write the failing route tests**

Add a compare-route test that renders `/compare` with no `slug` params and one with four `slug` params. Update the root-route test so both the app navigation and the home action row expose a `Compare products` link.

```tsx
expect(screen.getByRole("heading", { name: "Compare products" })).toBeInTheDocument();
expect(screen.getByText("Choose up to 3 products to compare.")).toBeInTheDocument();
expect(screen.getByText("You can compare up to 3 products.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
Expected: FAIL because the compare route and compare navigation link do not exist yet.

**Step 3: Write the minimal route and loader**

Create a route-local loader that reads repeated `slug` params from `request.url`, trims empty values, and returns one of three states: `empty`, `too_many`, or `ready`.

```ts
type CompareRouteLoaderData =
  | { status: "empty"; slugs: [] }
  | { status: "too_many"; slugs: string[] }
  | { status: "ready"; slugs: string[] };
```

Render a narrow route shell with a stable `<h1>Compare products</h1>` heading and terse empty/limit copy. Register `/compare` in the router and expose `Compare products` links from the app navigation and the home action row.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare assets/src/router.tsx assets/src/routes/root.tsx assets/src/routes/__tests__/root.route.test.tsx
git commit -m "feat(frontend): add compare route shell baseline"
```

### Task 2: Load and render up to three compared product cards

**Files:**
- Modify: `assets/src/routes/compare/api.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing ready-state tests**

Add a compare-route test that renders `/compare?slug=detail-product&slug=second-product` and stubs the existing GraphQL product-detail responses in order. Assert the loader keeps URL order and the route renders both product cards.

```tsx
expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Second Product" })).toBeInTheDocument();
expect(fetchGraphQLMock).toHaveBeenCalledTimes(2);
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because the compare route does not yet fetch and render selected products.

**Step 3: Write the minimal compare ready state**

Reuse `loadProductDetail/2` from `assets/src/routes/products/api.ts` for each selected slug and return a `ready` payload that includes the compared products in the same order they appeared in the URL.

```ts
const products = await Promise.all(
  uniqueSlugs.map((slug) => loadProductDetail(slug, ssrContext))
);
```

Render a simple comparison grid with one card per product showing name, brand, slug, and description.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add assets/src/routes/compare/api.ts assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): render compare route product cards"
```

### Task 3: Add missing and unavailable compare states with slice verification

**Files:**
- Modify: `assets/src/routes/compare/api.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

**Step 1: Write the failing state tests**

Add one test for a missing product slug and one test for a rejected product-detail request.

```tsx
expect(screen.getByText("One or more selected products were not found.")).toBeInTheDocument();
expect(screen.getByText("Comparison unavailable.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify failure**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: FAIL because the compare route does not yet distinguish missing and failed product loads.

**Step 3: Write the minimal state handling**

If any selected slug returns `null`, return a route-local `not_found` state. If any detail request throws, return an `error` state. Keep the empty and over-limit guards intact.

```ts
type CompareRouteLoaderData =
  | { status: "empty"; slugs: [] }
  | { status: "too_many"; slugs: string[] }
  | { status: "not_found"; slugs: string[] }
  | { status: "error"; slugs: string[] }
  | { status: "ready"; slugs: string[]; products: ProductDetail[] };
```

**Step 4: Run the focused route verification**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
Expected: PASS.

**Step 5: Run the slice verification**

Run: `cd assets && bun run typecheck && bun run test:unit`
Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/compare/api.ts assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "test(frontend): cover compare route states"
```
