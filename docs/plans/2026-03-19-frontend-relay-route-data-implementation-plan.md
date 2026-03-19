# Frontend Relay Route-Data Adoption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the frontend's manual route-local GraphQL fetching with proper Relay query and mutation flows while preserving the current React Router SSR architecture.

**Architecture:** Keep React Router loaders as the route orchestration layer, but narrow them to URL guards, redirects, and Relay query preloading. Move route data ownership into Relay-tagged queries, fragments, and mutations, add Relay store dehydration/hydration across SSR, and delete the ambiguous route-local `api.ts` GraphQL wrappers once each route is migrated.

**Tech Stack:** Bun, React 19, React Router v7 SSR, Relay, TypeScript, Vitest, GraphQL over `/api/graphql`.

---

### Task 1: Add Relay SSR hydration and route-preload primitives

**Files:**
- Create: `assets/src/relay/ssr.ts`
- Create: `assets/src/relay/route-preload.ts`
- Modify: `assets/src/relay/environment.ts`
- Modify: `assets/src/relay/load-query.ts`
- Modify: `assets/src/entry.client.tsx`
- Modify: `assets/src/entry.server.tsx`
- Modify: `assets/src/router.tsx`
- Test: `assets/src/relay/__tests__/route-preload.test.ts`
- Test: `assets/src/__tests__/entry.server.test.tsx`

**Step 1: Write the failing tests**

Add a Relay SSR test that dehydrates a populated environment into serializable records and a server-render test that proves those records are emitted into the hydration bootstrap.

```ts
test("dehydrateRelayEnvironment returns the populated record source", async () => {
  const environment = createRelayEnvironment();
  primeRelayRecord(environment, "client:root", { __id: "client:root" });

  expect(dehydrateRelayEnvironment(environment)).toEqual(
    expect.objectContaining({ "client:root": expect.any(Object) })
  );
});
```

```tsx
test("server render includes serialized Relay records for matched route queries", async () => {
  await expect(render("/products")).resolves.toContain("__relayRecords");
});
```

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/__tests__/entry.server.test.tsx`

Expected: FAIL because the Relay environment cannot yet dehydrate/hydrate records and server render does not expose any Relay bootstrap payload.

**Step 3: Write the minimal implementation**

Add a small SSR utility that can create an environment from optional records and extract the populated record source back out for serialization.

```ts
export function createRelayEnvironment(options: CreateRelayEnvironmentOptions = {}) {
  const recordSource = new RecordSource(options.records ?? {});

  return new Environment({
    network: Network.create((params, variables) => {
      if (!params.text) {
        throw new Error(`Relay operation text is missing for request: ${params.name ?? "unknown"}`);
      }

      return fetchGraphQL(params.text, variables as Record<string, unknown>, options.ssrContext);
    }),
    store: new Store(recordSource)
  });
}
```

Serialize the records into a stable bootstrap payload in `entry.server.tsx`, restore them in `entry.client.tsx`, and add a small route-preload helper so later route loaders have one place to register preloaded operations.

**Step 4: Run the tests to verify they pass**

Run: `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/__tests__/entry.server.test.tsx`

Expected: PASS.

**Step 5: Run focused verification**

Run: `cd assets && bun run typecheck`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/relay/ssr.ts assets/src/relay/route-preload.ts assets/src/relay/environment.ts assets/src/relay/load-query.ts assets/src/entry.client.tsx assets/src/entry.server.tsx assets/src/router.tsx assets/src/relay/__tests__/route-preload.test.ts assets/src/__tests__/entry.server.test.tsx
git commit -m "feat(frontend): add relay ssr hydration primitives"
```

### Task 2: Migrate the browse route to a Relay preloaded query

**Files:**
- Delete: `assets/src/routes/catalog/api.ts`
- Create: `assets/src/routes/catalog/loader.ts`
- Create: `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- Create: `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing tests**

Update the browse route tests so the route renders from a Relay-preloaded query instead of a loader DTO and still exposes browse links and empty/unavailable states.

```tsx
test("renders browse products from the Relay route query", () => {
  render(<BrowseRoute />);
  expect(screen.getByRole("link", { name: "Catalog First" })).toHaveAttribute(
    "href",
    "/products/catalog-first"
  );
});
```

Add one test that proves the route falls back to `Catalog unavailable.` when the preload path rejects.

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`

Expected: FAIL because the browse route still depends on `assets/src/routes/catalog/api.ts` and no Relay query document exists.

**Step 3: Write the minimal implementation**

Create a tagged Relay query for the route and preload it in a new `loader.ts`.

```ts
export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          name
          slug
          brand {
            name
          }
        }
      }
    }
  }
`;
```

Render the route through `usePreloadedQuery`, keep the current empty/unavailable UI copy, and remove the old manual response parsing module.

**Step 4: Run the Relay compile and route tests**

Run: `cd assets && bun run relay && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`

Expected: PASS.

**Step 5: Run focused verification**

Run: `cd assets && bun run typecheck`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/catalog/loader.ts assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/__tests__/browse.route.test.tsx assets/src/router.tsx
git rm assets/src/routes/catalog/api.ts
git commit -m "feat(frontend): migrate browse route to relay"
```

### Task 3: Migrate the product detail and offers route to Relay

**Files:**
- Delete: `assets/src/routes/products/api.ts`
- Create: `assets/src/routes/products/loader.ts`
- Create: `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- Create: `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- Create: `assets/src/__generated__/ProductDetailRouteQuery.graphql.ts`
- Create: `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing tests**

Keep the current success, not-found, offer-empty, and offer-unavailable assertions, but drive the route through a Relay-preloaded query instead of the old loader DTO.

```tsx
expect(screen.getByRole("heading", { name: "Detail Product" })).toBeInTheDocument();
expect(screen.getByText("Active offers")).toBeInTheDocument();
expect(screen.getByText("No active offers yet.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`

Expected: FAIL because the detail route still expects `productDetailLoader` data assembled by `assets/src/routes/products/api.ts`.

**Step 3: Write the minimal implementation**

Preload the existing product-detail GraphQL surface by slug, then preload the existing offers surface with the resolved product ID so the route can render through Relay without changing the backend contract.

```ts
export const productDetailRouteQuery = graphql`
  query ProductDetailRouteQuery($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      brand {
        name
      }
    }
  }
`;
```

```ts
export const productOffersRouteQuery = graphql`
  query ProductOffersRouteQuery($productId: ID!, $first: Int!) {
    merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) {
      edges {
        node {
          id
          url
          merchant {
            name
          }
          latestPrice {
            price
          }
        }
      }
    }
  }
`;
```

Preserve the current route-local not-found and unavailable UI, but make the loader responsible only for param validation plus the two Relay preloads.

**Step 4: Run the Relay compile and route tests**

Run: `cd assets && bun run relay && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`

Expected: PASS.

**Step 5: Run focused verification**

Run: `cd assets && bun run typecheck && bun x vitest run src/__tests__/entry.server.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/products/loader.ts assets/src/routes/products/queries/ProductDetailRouteQuery.ts assets/src/routes/products/queries/ProductOffersRouteQuery.ts assets/src/__generated__/ProductDetailRouteQuery.graphql.ts assets/src/__generated__/ProductOffersRouteQuery.graphql.ts assets/src/routes/products/detail.tsx assets/src/routes/products/__tests__/detail.route.test.tsx assets/src/router.tsx
git rm assets/src/routes/products/api.ts
git commit -m "feat(frontend): migrate product detail route to relay"
```

### Task 4: Migrate the compare route and save mutation to Relay

**Files:**
- Delete: `assets/src/routes/compare/api.ts`
- Create: `assets/src/routes/compare/loader.ts`
- Create: `assets/src/routes/compare/mutations/CreateSavedComparisonSetMutation.ts`
- Create: `assets/src/__generated__/CreateSavedComparisonSetMutation.graphql.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Modify: `assets/src/router.tsx`

**Step 1: Write the failing tests**

Keep the current empty, over-limit, ready, not-found, unavailable, and save-action coverage, but assert that save now flows through a Relay mutation and the route renders from a Relay query.

```tsx
await userEvent.click(screen.getByRole("button", { name: /save comparison/i }));
expect(commitMutationMock).toHaveBeenCalled();
expect(screen.getByText("Comparison saved.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`

Expected: FAIL because the compare route still imports `loadProductDetail` and `createSavedComparisonSet` from the manual `api.ts` module.

**Step 3: Write the minimal implementation**

Reuse the Relay product-detail query from Task 3 by preloading it once per selected slug in URL order, then move the save action to `useMutation`.

```ts
const [commitCreateSavedComparisonSet, isSaving] =
  useMutation<CreateSavedComparisonSetMutation>(createSavedComparisonSetMutation);
```

Keep URL-based compare selection and the current UI copy, but stop importing `fetchGraphQL` directly from the route tree.

**Step 4: Run the Relay compile and route tests**

Run: `cd assets && bun run relay && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`

Expected: PASS.

**Step 5: Run focused verification**

Run: `cd assets && bun run typecheck`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/compare/loader.ts assets/src/routes/compare/mutations/CreateSavedComparisonSetMutation.ts assets/src/__generated__/CreateSavedComparisonSetMutation.graphql.ts assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx assets/src/router.tsx
git rm assets/src/routes/compare/api.ts
git commit -m "feat(frontend): migrate compare route to relay"
```

### Task 5: Migrate auth mutations to Relay and trim the remaining manual fetch helpers

**Files:**
- Delete: `assets/src/routes/auth/actions.ts`
- Create: `assets/src/routes/auth/mutations/LoginMutation.ts`
- Create: `assets/src/routes/auth/mutations/RegisterMutation.ts`
- Create: `assets/src/routes/auth/mutations/ForgotPasswordMutation.ts`
- Create: `assets/src/routes/auth/mutations/ResetPasswordMutation.ts`
- Create: `assets/src/routes/auth/mutations/VerifyEmailMutation.ts`
- Create: `assets/src/routes/auth/errors.ts`
- Create: `assets/src/__generated__/LoginMutation.graphql.ts`
- Create: `assets/src/__generated__/RegisterMutation.graphql.ts`
- Create: `assets/src/__generated__/ForgotPasswordMutation.graphql.ts`
- Create: `assets/src/__generated__/ResetPasswordMutation.graphql.ts`
- Create: `assets/src/__generated__/VerifyEmailMutation.graphql.ts`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Modify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Modify: `assets/src/routes/auth/__tests__/recovery.route.test.tsx`

**Step 1: Write the failing tests**

Update the auth route tests so they still cover success, validation, transport, and token edge cases after the routes switch to Relay mutations.

```tsx
await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
expect(screen.getByText("Request failed. Please try again.")).toBeInTheDocument();
```

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

Expected: FAIL because the auth routes still call the old helper module and no Relay mutations exist yet.

**Step 3: Write the minimal implementation**

Move the shared mutation error normalization into `errors.ts` and execute each auth flow through `useMutation`.

```ts
const [commitLogin, isInFlight] = useMutation<LoginMutation>(loginMutation);

commitLogin({
  variables: { email, password },
  onCompleted(response) {
    // normalize payload errors here
  },
  onError(error) {
    setErrors([{ code: "NETWORK_ERROR", field: null, message: sanitizeTransportError(error) }]);
  }
});
```

Keep the current user-facing copy and form UX intact while removing the last route-level `fetchGraphQL` imports.

**Step 4: Run the Relay compile and auth tests**

Run: `cd assets && bun run relay && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

Expected: PASS.

**Step 5: Run focused verification**

Run: `cd assets && bun run typecheck`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/routes/auth/mutations assets/src/routes/auth/errors.ts assets/src/__generated__/LoginMutation.graphql.ts assets/src/__generated__/RegisterMutation.graphql.ts assets/src/__generated__/ForgotPasswordMutation.graphql.ts assets/src/__generated__/ResetPasswordMutation.graphql.ts assets/src/__generated__/VerifyEmailMutation.graphql.ts assets/src/routes/auth/login.tsx assets/src/routes/auth/register.tsx assets/src/routes/auth/forgot-password.tsx assets/src/routes/auth/reset-password.tsx assets/src/routes/auth/verify-email.tsx assets/src/routes/auth/__tests__/session.route.test.tsx assets/src/routes/auth/__tests__/recovery.route.test.tsx
git rm assets/src/routes/auth/actions.ts
git commit -m "refactor(frontend): move auth flows onto relay mutations"
```

### Task 6: Remove dead manual-fetch plumbing, refresh docs, and requeue saved comparisons on top of Relay

**Files:**
- Modify: `assets/src/relay/fetch-graphql.ts`
- Modify: `assets/src/relay/__tests__/fetch-graphql.test.ts`
- Modify: `docs/work/frontend-relay-route-data.md`
- Modify: `docs/work/frontend-saved-comparisons-ui.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `ARCHITECTURE.md`

**Step 1: Write the failing tests**

Add one transport-layer test that proves `fetchGraphQL` is now only concerned with the network request shape and SSR cookie forwarding, not route-specific payload parsing.

```ts
test("fetchGraphQL stays a thin relay network helper", async () => {
  await fetchGraphQL("query Viewer { viewer { id } }", {}, { cookieString: "session=123" });
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/graphql"),
    expect.objectContaining({ headers: expect.objectContaining({ cookie: "session=123" }) })
  );
});
```

**Step 2: Run the tests to verify they fail**

Run: `cd assets && bun x vitest run src/relay/__tests__/fetch-graphql.test.ts`

Expected: FAIL if the transport helper still carries route-specific assumptions that were only needed by the deleted manual fetch modules.

**Step 3: Write the minimal implementation**

Trim `fetchGraphQL` to a pure Relay network helper, delete any dead route parsing helpers left behind by the migration, and update the work docs to close this slice and re-open the saved-comparisons UI as the next route feature on top of the new Relay path.

**Step 4: Run the full frontend verification**

Run: `cd assets && bun run relay && bun run typecheck && bun run test:unit`

Expected: PASS.

**Step 5: Run the focused SSR verification**

Run: `cd assets && bun x vitest run src/__tests__/entry.server.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add assets/src/relay/fetch-graphql.ts assets/src/relay/__tests__/fetch-graphql.test.ts docs/work/frontend-relay-route-data.md docs/work/frontend-saved-comparisons-ui.md docs/work/index.md docs/plans/NOW.md ARCHITECTURE.md
git commit -m "docs(frontend): close relay route-data adoption slice"
```
