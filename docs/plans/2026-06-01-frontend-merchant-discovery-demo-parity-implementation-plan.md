# Frontend Merchant Discovery Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing public merchant discovery GraphQL contract demoable from the browser UI.

**Architecture:** Add a Relay-backed `/merchants` route that preloads the existing `merchants(first:, after:)` connection through the React Router loader context. Keep the first UI slice read-only: merchant name, domain, cursor pagination, empty state, and route-loader error recovery. Do not add REST endpoints or browser-auth token flows.

**Tech Stack:** Phoenix Absinthe GraphQL, React Router loaders, React Relay, Bun, Vitest, Testing Library, StyleX primitives.

---

## Existing Contract

- Backend query: `merchants(first: Int, after: String): MerchantConnection`.
- Returned shape: `edges { cursor node { id name domain } }` plus `pageInfo`.
- Existing frontend patterns to follow:
  - Relay route preloading from `assets/src/relay/route-preload.ts`.
  - Route loader recovery from `assets/src/routes/loader-errors.ts`.
  - Root navigation tests in `assets/src/routes/__tests__/root.route.test.tsx`.
  - Product browse/detail route tests for Relay-preloaded route rendering.

## File Structure

- Create `assets/src/routes/merchants/queries/MerchantDirectoryRouteQuery.ts` for the route query.
- Create `assets/src/routes/merchants/loader.ts` for cursor and page-size normalization plus Relay preloading.
- Create `assets/src/routes/merchants/index.tsx` for the route UI.
- Create `assets/src/routes/merchants/__tests__/merchant-directory-loader.test.ts` for loader tests.
- Create `assets/src/routes/merchants/__tests__/merchant-directory.route.test.tsx` for route render tests.
- Modify `assets/src/router.tsx` to register `/merchants`.
- Modify `assets/src/routes/root.tsx` and `assets/src/routes/__tests__/root.route.test.tsx` to expose the route from primary navigation and home actions.
- Generated Relay artifacts under `assets/src/__generated__/**` are produced by `bun run relay`.
- Update `docs/work/frontend-merchant-discovery-demo-parity.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` at the relevant milestone boundaries.

---

### Task 1: Add The Relay Route Query And Loader

**Files:**
- Create: `assets/src/routes/merchants/queries/MerchantDirectoryRouteQuery.ts`
- Create: `assets/src/routes/merchants/loader.ts`
- Create: `assets/src/routes/merchants/__tests__/merchant-directory-loader.test.ts`
- Modify generated: `assets/src/__generated__/MerchantDirectoryRouteQuery.graphql.ts`
- Modify after verification: `docs/work/frontend-merchant-discovery-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing loader tests**

Create `assets/src/routes/merchants/__tests__/merchant-directory-loader.test.ts` with coverage for:

```ts
test("merchantDirectoryLoader preloads the default merchant page");
test("merchantDirectoryLoader preserves supported cursor and page-size params");
test("merchantDirectoryLoader drops invalid page-size params instead of broadening them");
test("merchantDirectoryLoader returns error state when route preloading fails");
```

Expected default variables:

```ts
{
  first: 20,
  after: null
}
```

- [ ] **Step 2: Run the loader tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts
```

Expected: FAIL because the route query and loader do not exist.

- [ ] **Step 3: Add the route query**

Create `assets/src/routes/merchants/queries/MerchantDirectoryRouteQuery.ts`:

```ts
import { graphql } from "react-relay";

export default graphql`
  query MerchantDirectoryRouteQuery($first: Int, $after: String) {
    merchants(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          domain
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
```

- [ ] **Step 4: Add the loader**

Create `assets/src/routes/merchants/loader.ts` with:

- `merchantDirectoryLoader` reading the Relay environment from router context.
- Search-param normalization for `after` and `first`.
- Default page size `20`.
- Maximum page size `50`.
- Recoverable route preload error state using `recoverRouteLoaderError`.
- Loader data that includes normalized pagination params plus the Relay route query descriptor when ready.

- [ ] **Step 5: Generate Relay artifacts**

Run:

```bash
cd assets && bun run relay
```

Expected: PASS and create `assets/src/__generated__/MerchantDirectoryRouteQuery.graphql.ts`.

- [ ] **Step 6: Run the loader tests to verify they pass**

Run:

```bash
cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 8: Update queue docs**

Update `docs/work/frontend-merchant-discovery-demo-parity.md` and `docs/plans/NOW.md`:

- Mark Task 1 complete.
- Record the exact verification commands.
- Advance the current batch to Task 2.

---

### Task 2: Render The Merchant Discovery Route

**Files:**
- Create: `assets/src/routes/merchants/index.tsx`
- Create: `assets/src/routes/merchants/__tests__/merchant-directory.route.test.tsx`
- Modify after verification: `docs/work/frontend-merchant-discovery-demo-parity.md`
- Modify after verification: `docs/plans/NOW.md`

- [ ] **Step 1: Write failing route render tests**

Create route tests covering:

```ts
test("merchant directory renders merchant names and domains");
test("merchant directory renders an empty state");
test("merchant directory renders next-page navigation when available");
test("merchant directory renders the loader error state");
```

- [ ] **Step 2: Run the route tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory.route.test.tsx
```

Expected: FAIL because the route component does not exist.

- [ ] **Step 3: Add the route component**

Create `assets/src/routes/merchants/index.tsx` with:

- `MerchantDirectoryRoute` reading `merchantDirectoryLoader` data through `useLoaderData`.
- A heading `Merchants`.
- A ready path using `ResettableErrorBoundary`, `Suspense`, `useRoutePreloadedQuery`, and `usePreloadedQuery`.
- A merchant list that renders each merchant name and domain.
- Empty-state copy when no merchants are returned.
- A next-page link that preserves `after=<endCursor>` and the normalized page size when `pageInfo.hasNextPage` is true.
- A loader/query fallback with `role="alert"`.

- [ ] **Step 4: Run route tests**

Run:

```bash
cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory.route.test.tsx src/routes/merchants/__tests__/merchant-directory-loader.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run frontend typecheck**

Run:

```bash
cd assets && bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Update queue docs**

Update `docs/work/frontend-merchant-discovery-demo-parity.md` and `docs/plans/NOW.md`:

- Mark Task 2 complete.
- Record exact verification commands.
- Advance the current batch to Task 3.

---

### Task 3: Wire Navigation And Close The Lane

**Files:**
- Modify: `assets/src/router.tsx`
- Modify: `assets/src/routes/root.tsx`
- Modify: `assets/src/routes/__tests__/root.route.test.tsx`
- Modify: `assets/src/__tests__/router.test.tsx`
- Modify: `docs/work/frontend-merchant-discovery-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`
- Modify: this implementation plan

- [ ] **Step 1: Write failing route registration and navigation tests**

Update tests to assert:

```ts
expect(screen.getByRole("link", { name: "Merchants" })).toHaveAttribute(
  "href",
  "/merchants"
);
```

Assert the link exists in both primary navigation and home actions. Add a router test that the route list includes `merchants` with `merchantDirectoryLoader`.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
```

Expected: FAIL because the navigation link and route registration are not present.

- [ ] **Step 3: Register the route and navigation**

Modify `assets/src/router.tsx`:

```ts
import { MerchantDirectoryRoute } from "./routes/merchants";
import { merchantDirectoryLoader } from "./routes/merchants/loader";
```

Add a child route:

```tsx
{
  path: "merchants",
  loader: merchantDirectoryLoader,
  element: <MerchantDirectoryRoute />
}
```

Update `RootLayout` and `RootRoute` in `assets/src/routes/root.tsx` to add `Merchants` links to `/merchants`.

- [ ] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/merchants/__tests__/merchant-directory-loader.test.ts src/routes/merchants/__tests__/merchant-directory.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx
cd assets && bun run typecheck
```

Expected: all commands pass.

- [ ] **Step 5: Run backend contract verification**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: PASS.

- [ ] **Step 6: Close queue docs**

Update queue and architecture docs to mark the merchant discovery demo parity lane completed:

- `docs/work/frontend-merchant-discovery-demo-parity.md`
- `docs/work/index.md`
- `docs/plans/NOW.md`
- `docs/plans/INDEX.md`
- `ARCHITECTURE.md`
- this implementation plan

- [ ] **Step 7: Final verification**

Run:

```bash
cd assets && bun run check
mix test test/product_compare_web/graphql/catalog_queries_test.exs
git diff --check
```

Expected: all commands pass.
