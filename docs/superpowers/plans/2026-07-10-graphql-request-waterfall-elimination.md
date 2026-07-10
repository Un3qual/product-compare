# GraphQL Request Waterfall Elimination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make comparison, product detail, and catalog issue one initial GraphQL route-data request each, while saved comparisons and API tokens fetch only one cursor page per navigation.

**Architecture:** Add ordered comparison lookup and product-scoped offer connections to the GraphQL schema, then compose each screen's initial data into one Relay query document. Replace eager cursor exhaustion with URL-driven single-page loaders and explicit first/next navigation.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, Ecto, React 19, React Router 7, Relay 20, TypeScript, Vitest, ExUnit.

## Global Constraints

- Frontend browser data continues to use GraphQL over `/api/graphql`.
- No HTTP GraphQL batching transport.
- No change to browser authentication or the root viewer contract.
- No backward Relay pagination contract.
- No automatic loading of every saved comparison or API token.
- No unrelated visual redesign.
- Every production behavior change starts with a focused failing test.
- Every route request continues to receive the React Router abort signal.

---

### Task 1: Add ordered comparison products and product-scoped offers

**Files:**

- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/resolvers/pricing_resolver.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Test: `test/product_compare_web/graphql/pricing_queries_test.exs`

**Interfaces:**

- Produces: `Catalog.list_products_by_slugs/1 :: [Product.t() | nil]`.
- Produces: GraphQL `comparisonProducts(slugs: [String!]!): [Product]!` with ordered nullable entries.
- Produces: GraphQL `Product.merchantProducts(first:, after:, merchantId:, activeOnly:)` using the parent product ID.
- Preserves: top-level `merchantProducts(input:)` unchanged.

- [ ] **Step 1: Write failing GraphQL tests for ordered comparison lookup**

Add tests that execute:

```graphql
query ComparisonProducts($slugs: [String!]!) {
  comparisonProducts(slugs: $slugs) {
    id
    slug
    name
  }
}
```

Assert that `[second.slug, "missing-product", first.slug]` returns `[second, null, first]`. Add separate assertions that blank, duplicate, empty, and four-item inputs return deterministic GraphQL errors.

- [ ] **Step 2: Run the ordered comparison tests and verify RED**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`

Expected: FAIL because `comparisonProducts` is not defined.

- [ ] **Step 3: Implement ordered lookup and validation**

Add the catalog lookup:

```elixir
@spec list_products_by_slugs([String.t()]) :: [Product.t() | nil]
def list_products_by_slugs(slugs) when is_list(slugs) do
  products_by_slug =
    Product
    |> where([product], product.slug in ^slugs)
    |> Repo.all()
    |> Map.new(&{&1.slug, &1})

  Enum.map(slugs, &Map.get(products_by_slug, &1))
end
```

Add `CatalogResolver.comparison_products/3` with a private normalizer that accepts exactly one to three unique, trimmed, non-blank strings and returns these exact errors:

```elixir
"comparison slugs must contain between 1 and 3 values"
"comparison slugs must be unique non-blank strings"
```

Expose it in `query do` as:

```elixir
field :comparison_products, non_null(list_of(:product)) do
  arg(:slugs, non_null(list_of(non_null(:string))))
  resolve(&CatalogResolver.comparison_products/3)
end
```

- [ ] **Step 4: Run the ordered comparison tests and verify GREEN**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs`

Expected: PASS.

- [ ] **Step 5: Write failing tests for product-scoped offers**

Add a query test using:

```graphql
query ProductOffers($slug: String!, $first: Int!, $activeOnly: Boolean) {
  product(slug: $slug) {
    id
    merchantProducts(first: $first, activeOnly: $activeOnly) {
      edges {
        node {
          id
          productId
          isActive
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

Assert the field returns only the parent product's offers, honors `activeOnly`, and paginates with the same connection behavior as the top-level field.

- [ ] **Step 6: Run the product-scoped offer tests and verify RED**

Run: `mix test test/product_compare_web/graphql/pricing_queries_test.exs`

Expected: FAIL because `Product.merchantProducts` is not defined.

- [ ] **Step 7: Implement the product-scoped resolver**

Expose the nested field on `object :product`:

```elixir
field :merchant_products, :merchant_product_connection do
  arg(:first, :integer)
  arg(:after, :string)
  arg(:merchant_id, :id)
  arg(:active_only, :boolean)

  resolve(&PricingResolver.product_merchant_products/3)
end
```

Implement the resolver by decoding only the optional merchant ID and taking the product ID from the parent:

```elixir
def product_merchant_products(%{id: product_id}, args, _resolution)
    when is_integer(product_id) do
  with {:ok, merchant_id} <-
         Input.decode_optional_integer_id(
           Input.fetch_value(args || %{}, :merchant_id),
           :merchant,
           "merchant"
         ) do
    attrs = %{
      product_id: product_id,
      merchant_id: merchant_id,
      active_only: Input.fetch_value(args || %{}, :active_only, false),
      first: Input.fetch_value(args || %{}, :first),
      after: Input.fetch_value(args || %{}, :after)
    }

    attrs
    |> Pricing.list_merchant_products_query()
    |> Connection.from_query_result(Input.connection_args(attrs), Repo)
  end
end
```

Return `{:error, "invalid product id"}` for a parent without an integer ID.

- [ ] **Step 8: Run focused backend tests and verify GREEN**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`

Expected: PASS.

- [ ] **Step 9: Commit the backend contract milestone**

```bash
git add lib/product_compare/catalog.ex lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/resolvers/pricing_resolver.ex test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs
git commit -m "feat: add comparison route graphql contracts"
```

### Task 2: Consolidate the comparison route into one initial query

**Files:**

- Create: `assets/src/routes/compare/queries/CompareRouteQuery.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/product-list.tsx`
- Modify: `assets/src/routes/compare/product-picker.tsx`
- Delete: `assets/src/routes/compare/queries/CompareOfferContextQuery.ts`
- Modify: `assets/src/routes/compare/queries/CompareProductPickerQuery.ts`
- Generate: `assets/src/__generated__/CompareRouteQuery.graphql.ts`
- Delete generated: `assets/src/__generated__/CompareOfferContextQuery.graphql.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Test: `assets/test/routes/compare/compare-relay-migration.test.tsx`

**Interfaces:**

- Consumes: `comparisonProducts` and nested `Product.merchantProducts` from Task 1.
- Produces: ready loader data with one `query: RelayRouteQueryDescriptor<CompareRouteQuery["variables"]>`.
- Preserves: `products`, `offerContexts`, ordered slugs, spec mode, picker pagination, and comparison mutations.

- [ ] **Step 1: Replace the request-count expectation with a failing one-request test**

Change the two-product loader test to mock one fetched `CompareRouteQuery` response containing both comparison products, their nested merchant-product connections, and the picker connection. Assert:

```typescript
expect(mockedFetchRouteQuery).toHaveBeenCalledTimes(1);
expect(mockedFetchRouteQuery).toHaveBeenCalledWith(
  environment,
  expect.anything(),
  {
    slugs: ["detail-product", "second-product"],
    offerFirst: 3,
    pickerFirst: 24,
    pickerAfter: null
  },
  { signal: request.signal }
);
```

Add a route test that renders the picker from Relay store data and asserts the initial picker operation does not call the network a second time.

- [ ] **Step 2: Run the focused comparison tests and verify RED**

Run: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/compare-relay-migration.test.tsx`

Expected: FAIL because the loader still makes per-product and per-offer requests.

- [ ] **Step 3: Add the combined Relay query**

Create `CompareRouteQuery.ts` with this shape:

```typescript
export const compareRouteQuery = graphql`
  query CompareRouteQuery(
    $slugs: [String!]!
    $offerFirst: Int!
    $pickerFirst: Int!
    $pickerAfter: String
  ) {
    comparisonProducts(slugs: $slugs) {
      id
      name
      slug
      description
      brand { id name }
      currentAttributes {
        attributeId code displayName dataType valueText sortOrder groupLabel
        isRequired numericValue booleanValue enumOptionId unitSymbol
      }
      merchantProducts(first: $offerFirst, activeOnly: true) {
        edges {
          node {
            id currency
            merchant { id name domain }
            latestPrice { id price observedAt }
            activeCoupons(first: 2) {
              edges { node { code discountType discountValue currency validTo } }
              pageInfo { hasNextPage }
            }
            priceHistory(first: 3) {
              edges { node { id price observedAt } }
              pageInfo { hasNextPage }
            }
          }
        }
        pageInfo { endCursor hasNextPage }
      }
    }
    products(first: $pickerFirst, after: $pickerAfter) {
      edges { node { id name slug brand { id name } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
```

- [ ] **Step 4: Rewrite the loader around one fetched query**

Call `fetchRouteQuery<CompareRouteQuery>` once. Detect positional nulls for `not_found`, summarize every present product, summarize each nested offer connection into the existing `CompareOfferContextSummary`, and return the single descriptor as `query`.

Remove `fetchOfferContextsByProductId`, `fetchOfferContextPages`, the per-query disposal arrays, and imports of `ProductDetailRouteQuery` and `CompareOfferContextQuery`.

- [ ] **Step 5: Retain the combined query and render summary cards**

Add one retainer in the ready route:

```tsx
function CompareRouteQueryRetainer({ query }: { query: CompareReadyData["query"] }) {
  const queryRef = useRoutePreloadedQuery<CompareRouteQuery>(compareRouteQuery, query);
  usePreloadedQuery<CompareRouteQuery>(compareRouteQuery, queryRef);
  return null;
}
```

Render product cards directly from `CompareProductSummary` instead of retaining one `ProductDetailRouteQuery` per card. Keep `ProductAttributeList`, remove links, matrix behavior, and decision summary unchanged.

Keep `CompareProductPickerQuery` for user-triggered later pages. Its initial `useLazyLoadQuery(..., {fetchPolicy: "store-or-network"})` must be satisfied by the normalized `products(first: 24, after: null)` data from `CompareRouteQuery`, so initial render performs no network request.

- [ ] **Step 6: Generate Relay artifacts**

Run: `cd assets && bun run relay`

Expected: `CompareRouteQuery.graphql.ts` is generated and obsolete artifacts are removed after their source operations are deleted.

- [ ] **Step 7: Run focused comparison tests and verify GREEN**

Run: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/compare-relay-migration.test.tsx`

Expected: PASS, including the one-request assertion.

- [ ] **Step 8: Commit the comparison milestone**

```bash
git add assets/src/routes/compare assets/src/__generated__ assets/test/routes/compare assets/schema.graphql
git commit -m "perf: collapse comparison graphql requests"
```

### Task 3: Consolidate product detail and catalog route queries

**Files:**

- Modify: `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- Delete: `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- Modify: `assets/src/routes/products/loader.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Modify generated: `assets/src/__generated__/ProductDetailRouteQuery.graphql.ts`
- Delete generated: `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- Modify: `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- Delete: `assets/src/routes/catalog/queries/ProductFilterMetadataQuery.ts`
- Modify: `assets/src/routes/catalog/loader.ts`
- Modify: `assets/src/routes/catalog/browse.tsx`
- Modify generated: `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- Delete generated: `assets/src/__generated__/ProductFilterMetadataQuery.graphql.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`

**Interfaces:**

- Consumes: nested `Product.merchantProducts` from Task 1.
- Produces: one product-detail query descriptor with nested offers.
- Produces: one catalog query descriptor containing products and filter metadata.

- [ ] **Step 1: Add failing one-call loader tests**

For product detail, assert one `fetchRouteQuery` call with `{slug, offerFirst: 6, offersAfter}` and a response whose `product.merchantProducts` contains the offer page.

For catalog, assert one `fetchRouteQuery` call using `BrowseProductsRouteQuery` and verify the response contains both `products` and `productFilterMetadata`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/catalog/browse.route.test.tsx`

Expected: FAIL because both loaders still orchestrate multiple operations.

- [ ] **Step 3: Merge offers into product detail**

Change `ProductDetailRouteQuery` variables to `($slug: String!, $offerFirst: Int!, $offersAfter: String)` and select:

```graphql
merchantProducts(first: $offerFirst, after: $offersAfter, activeOnly: true) {
  edges {
    cursor
    node {
      id url currency
      merchant { id name }
      latestPrice { id price observedAt }
      activeCoupons(first: 2) {
        edges { cursor node { code description discountType discountValue currency validTo terms } }
        pageInfo { hasNextPage }
      }
      priceHistory(first: 3) {
        edges { node { id price observedAt } }
        pageInfo { hasNextPage }
      }
    }
  }
  pageInfo { endCursor hasNextPage }
}
```

The loader performs one fetch and returns only `productQuery`. `ProductOffers` receives `product.merchantProducts` directly; remove the second query descriptor, second suspense boundary, and the `offers.status` branch.

- [ ] **Step 4: Merge filter metadata into catalog browse**

Add `productFilterMetadata(filters: $filters)` with the complete existing metadata selection to `BrowseProductsRouteQuery`. The loader performs one fetch and returns only `query`. `BrowseProducts` reads `data.productFilterMetadata`; remove the separate descriptor and imports.

- [ ] **Step 5: Generate Relay artifacts**

Run: `cd assets && bun run relay`

Expected: combined artifacts are updated and the two obsolete artifacts are removed.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/catalog/browse.route.test.tsx`

Expected: PASS with one call per loader.

- [ ] **Step 7: Commit the product-detail/catalog milestone**

```bash
git add assets/src/routes/products assets/src/routes/catalog assets/src/__generated__ assets/test/routes/products assets/test/routes/catalog assets/schema.graphql
git commit -m "perf: combine product route graphql data"
```

### Task 4: Replace eager cursor exhaustion with one-page navigation

**Files:**

- Modify: `assets/src/routes/compare/saved-data.ts`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/account/api-tokens/loader.ts`
- Modify: `assets/src/routes/account/api-tokens/index.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Test: `assets/test/routes/account/api-tokens/api-tokens-loader.test.ts`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`

**Interfaces:**

- Produces: saved-comparison loader data with `savedSetQuery`, `hasNextPage`, `endCursor`, and `after`.
- Produces: API-token loader data with `tokenQuery`, `hasNextPage`, `endCursor`, and `after`.
- Produces: first/next URL helpers that preserve status where applicable.

- [ ] **Step 1: Replace saved-comparison eager-pagination tests with RED one-page tests**

Given a first page with `hasNextPage: true`, assert the loader calls `fetchRouteQuery` exactly once, returns only first-page sets, and exposes the cursor. Given `?after=next-saved-page`, assert the one request includes that cursor.

Add route assertions for links:

```typescript
expect(screen.getByRole("link", { name: "Next saved comparisons" }))
  .toHaveAttribute("href", "/compare/saved?after=next-saved-page");
expect(screen.getByRole("link", { name: "First saved comparisons" }))
  .toHaveAttribute("href", "/compare/saved");
```

- [ ] **Step 2: Run saved-comparison tests and verify RED**

Run: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`

Expected: FAIL because the loader follows all pages and exposes no page navigation.

- [ ] **Step 3: Implement saved-comparison single-page loading**

Parse a trimmed `after` parameter, make one `fetchRouteQuery` call, summarize one page, and return:

```typescript
{
  status: savedSets.length === 0 ? "empty" : "ready",
  after,
  endCursor: page.endCursor,
  hasNextPage: page.hasNextPage,
  savedSetQuery: fetchedPage.descriptor,
  savedSets: page.savedSets
}
```

Replace descriptor arrays and retainers with one retainer. Add first/next links and change labels to `Filter visible saved comparisons` and `Sort visible saved comparisons`.

- [ ] **Step 4: Run saved-comparison tests and verify GREEN**

Run: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/compare/saved-comparisons-route-state.test.tsx`

Expected: PASS.

- [ ] **Step 5: Replace API-token eager-pagination tests with RED one-page tests**

Assert a response with `hasNextPage: true` triggers one request. Assert `?status=active&after=next-token-page` passes both the `ACTIVE` status and cursor. Add route assertions that first/next links preserve `status=active`.

- [ ] **Step 6: Run API-token tests and verify RED**

Run: `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens-loader.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`

Expected: FAIL because the loader follows every page and the route has no pagination links.

- [ ] **Step 7: Implement API-token single-page loading**

Parse `after`, issue one query, and return the one descriptor plus page metadata. Render:

```tsx
<nav aria-label="API token pages">
  {after ? <Link to={`/account/api-tokens?status=${tokenStatus}`}>First API tokens</Link> : null}
  {hasNextPage && endCursor ? (
    <Link to={`/account/api-tokens?status=${tokenStatus}&after=${encodeURIComponent(endCursor)}`}>
      Next API tokens
    </Link>
  ) : null}
</nav>
```

Keep create, rotate, revoke, status filtering, and local optimistic summaries unchanged.

- [ ] **Step 8: Run API-token tests and verify GREEN**

Run: `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens-loader.test.ts test/routes/account/api-tokens/api-tokens.route.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit the pagination milestone**

```bash
git add assets/src/routes/compare/saved-data.ts assets/src/routes/compare/saved.tsx assets/src/routes/account/api-tokens assets/test/routes/compare assets/test/routes/account/api-tokens
git commit -m "perf: stop eager route pagination"
```

### Task 5: Verify the complete batch and close the live lane

**Files:**

- Modify: `docs/work/frontend-graphql-request-waterfalls.md`
- Modify: `docs/work/index.md`

**Interfaces:**

- Consumes: all implementation milestones.
- Produces: current completion evidence and an empty active queue with the below-target explanation preserved.

- [ ] **Step 1: Run Relay generation and frontend checks**

Run:

```bash
cd assets
bun run relay
bun run check
```

Expected: Relay generation succeeds, TypeScript reports no errors, and the full Vitest suite reports zero failures.

- [ ] **Step 2: Run backend checks**

Run:

```bash
mix test
mix typecheck
mix format --check-formatted
```

Expected: all commands exit zero.

- [ ] **Step 3: Run hygiene and request-path audit**

Run:

```bash
rg -n 'while \(true\)|fetchOfferContextsByProductId|ProductOffersRouteQuery|ProductFilterMetadataQuery|CompareOfferContextQuery' assets/src
git diff --check
git status --short
```

Expected: no eager pagination loop or obsolete route-query references remain; diff check succeeds; status contains only intended tracked changes.

- [ ] **Step 4: Record completion evidence**

Set `docs/work/frontend-graphql-request-waterfalls.md` to `Status: done`, record exact test counts and commands, and move the active row in `docs/work/index.md` into `Just Completed`. Keep `Ready Work` empty with the existing explicit shortage of validated candidates.

- [ ] **Step 5: Commit the completion milestone**

```bash
git add docs/work/frontend-graphql-request-waterfalls.md docs/work/index.md
git commit -m "docs: record graphql waterfall verification"
```

- [ ] **Step 6: Inspect final history and diff**

Run:

```bash
git log --oneline -8
git status --short --branch
git diff HEAD~5..HEAD --stat
```

Expected: milestone commits are present and the worktree is clean.
