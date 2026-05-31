# Frontend Product Comparison Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make product comparison demoable from the UI by adding product selection controls and rendering current product attributes on product detail and compare pages.

**Architecture:** Keep the first slice intentionally narrow: expose current product attributes through the existing GraphQL `Product` object, then consume that field from the existing Relay-backed product detail and compare routes. Selection stays URL-driven through repeated `slug` query params, with browse/detail links and an empty compare-page selector providing the missing UI path.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, Postgres, Bun, React Router, React Relay, TypeScript, Vitest.

---

## Current State

- `/compare` already supports repeated `slug` query params through `assets/src/routes/compare/loader.ts`.
- `/compare?slug=a&slug=b` already preloads each selected product with `ProductDetailRouteQuery`.
- `/products` and `/products/:slug` do not expose a useful add-to-compare path.
- `/compare` empty state only says to choose products; it does not let the user choose them.
- Backend product attributes exist in `product_attribute_current`, `product_attribute_claims`, `attributes`, `units`, and `enum_options`.
- GraphQL `Product` currently exposes only identity and descriptive fields, so the frontend cannot render specs.

## Files And Responsibilities

- `lib/product_compare/specs.ex`
  - Add a focused read helper for current product attributes, preloading the selected claim, attribute, unit, and enum option.
- `lib/product_compare_web/resolvers/catalog_resolver.ex`
  - Add a resolver for `Product.currentAttributes`.
- `lib/product_compare_web/schema.ex`
  - Add `currentAttributes` to the `Product` GraphQL object plus supporting `ProductAttributeValue` object fields.
- `test/product_compare_web/graphql/catalog_queries_test.exs`
  - Add backend GraphQL coverage for current attribute values and product-without-attributes behavior.
- `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
  - Include `currentAttributes` in the product detail route query.
- `assets/src/routes/products/detail.tsx`
  - Render a Specifications section and an add-to-compare link.
- `assets/src/routes/catalog/browse.tsx`
  - Render compare links for each browsed product.
- `assets/src/routes/compare/index.tsx`
  - Render an empty-state product selector and render selected product attributes on ready-state compare cards.
- `assets/src/routes/compare/queries/CompareProductPickerQuery.ts`
  - Add a small Relay query for the empty compare-page selector.
- `assets/src/routes/products/__tests__/detail.route.test.tsx`
  - Cover product specs and the product detail add-to-compare link.
- `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
  - Cover browse-page compare links.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`
  - Cover the empty compare selector and ready compare attribute rendering.
- `docs/work/frontend-product-comparison-demo-parity.md`
  - New lane work doc created only when this plan is activated for implementation.
- `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`
  - Coordinator-owned docs updated at the implementation milestone boundary.

---

### Task 1: Expose Current Product Attributes In GraphQL

**Files:**
- Modify: `lib/product_compare/specs.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Test: `test/product_compare_web/graphql/catalog_queries_test.exs`

- [ ] **Step 1: Write the failing backend GraphQL test**

Add this test near the existing product detail/catalog query tests in `test/product_compare_web/graphql/catalog_queries_test.exs`:

```elixir
test "product exposes selected current attributes", %{conn: conn} do
  moderator = AccountsFixtures.user_fixture()
  product = SpecsFixtures.product_fixture(%{slug: "attribute-demo-monitor"})
  {refresh_rate_attribute, hz_unit} = refresh_rate_attribute_with_unit_fixture()
  panel_attribute = text_attribute_fixture(%{code: "panel-type", display_name: "Panel type"})
  hdr_attribute = bool_attribute_fixture(%{code: "hdr", display_name: "HDR"})

  {:ok, refresh_rate_claim} =
    Specs.propose_claim(
      product.id,
      refresh_rate_attribute.id,
      %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
      %{source_type: :import, created_by: moderator.id}
    )

  {:ok, panel_claim} =
    Specs.propose_claim(
      product.id,
      panel_attribute.id,
      %{value_text: "OLED"},
      %{source_type: :import, created_by: moderator.id}
    )

  {:ok, hdr_claim} =
    Specs.propose_claim(
      product.id,
      hdr_attribute.id,
      %{value_bool: true},
      %{source_type: :import, created_by: moderator.id}
    )

  {:ok, refresh_rate_claim} = Specs.accept_claim(refresh_rate_claim.id, moderator.id)
  {:ok, panel_claim} = Specs.accept_claim(panel_claim.id, moderator.id)
  {:ok, hdr_claim} = Specs.accept_claim(hdr_claim.id, moderator.id)

  {:ok, _current} =
    Specs.select_current_claim(product.id, refresh_rate_attribute.id, refresh_rate_claim.id, moderator.id)

  {:ok, _current} =
    Specs.select_current_claim(product.id, panel_attribute.id, panel_claim.id, moderator.id)

  {:ok, _current} =
    Specs.select_current_claim(product.id, hdr_attribute.id, hdr_claim.id, moderator.id)

  query = """
  query ProductAttributes($slug: String!) {
    product(slug: $slug) {
      currentAttributes {
        code
        displayName
        dataType
        valueText
      }
    }
  }
  """

  assert %{
           "data" => %{
             "product" => %{
               "currentAttributes" => attributes
             }
           }
         } = graphql(conn, query, %{"slug" => product.slug})

  assert [
           %{
             "code" => "hdr",
             "displayName" => "HDR",
             "dataType" => "bool",
             "valueText" => "Yes"
           },
           %{
             "code" => "panel-type",
             "displayName" => "Panel type",
             "dataType" => "text",
             "valueText" => "OLED"
           },
           %{
             "code" => "refresh-rate",
             "displayName" => "Refresh rate",
             "dataType" => "numeric",
             "valueText" => "144 Hz"
           }
         ] = attributes
end

test "product returns an empty currentAttributes list when no current claims exist", %{conn: conn} do
  product = SpecsFixtures.product_fixture(%{slug: "attribute-free-monitor"})

  query = """
  query ProductAttributes($slug: String!) {
    product(slug: $slug) {
      currentAttributes {
        code
        displayName
        valueText
      }
    }
  }
  """

  assert %{
           "data" => %{
             "product" => %{
               "currentAttributes" => []
             }
           }
         } = graphql(conn, query, %{"slug" => product.slug})
end

defp text_attribute_fixture(attrs) do
  SpecsFixtures.attribute_fixture(
    Map.merge(
      %{
        code: "demo-text-#{System.unique_integer([:positive])}",
        display_name: "Demo text",
        data_type: :text
      },
      attrs
    )
  )
end

defp bool_attribute_fixture(attrs \\ %{}) do
  SpecsFixtures.attribute_fixture(
    Map.merge(
      %{
        code: "demo-bool-#{System.unique_integer([:positive])}",
        display_name: "Demo bool",
        data_type: :bool
      },
      attrs
    )
  )
end

defp refresh_rate_attribute_with_unit_fixture do
  dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("catalog-dim-refresh-rate")})

  unit =
    SpecsFixtures.unit_fixture(%{
      dimension: dimension,
      code: "hz",
      symbol: "Hz"
    })

  attribute =
    SpecsFixtures.attribute_fixture(%{
      code: "refresh-rate",
      display_name: "Refresh rate",
      data_type: :numeric,
      dimension_id: dimension.id
    })

  {attribute, unit}
end
```

- [ ] **Step 2: Run the backend test to verify it fails**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: FAIL because `currentAttributes` is not defined on GraphQL `Product`.

- [ ] **Step 3: Add the Specs read helper**

In `lib/product_compare/specs.ex`, add this public function after `select_current_claim/4`:

```elixir
@spec list_current_attributes_for_product(pos_integer()) :: [ProductAttributeCurrent.t()]
def list_current_attributes_for_product(product_id) do
  ProductAttributeCurrent
  |> where([current], current.product_id == ^product_id)
  |> join(:inner, [current], attribute in assoc(current, :attribute))
  |> order_by([_current, attribute], asc: attribute.display_name, asc: attribute.code)
  |> preload([current, attribute], [
    attribute: attribute,
    claim: [:unit, :enum_option]
  ])
  |> Repo.all()
end
```

- [ ] **Step 4: Add the GraphQL field and resolver**

In `lib/product_compare_web/schema.ex`, add the field to `object :product`:

```elixir
field :current_attributes, non_null(list_of(non_null(:product_attribute_value))) do
  resolve(&CatalogResolver.current_attributes/3)
end
```

Add this object near the other product/catalog object types:

```elixir
object :product_attribute_value do
  field :code, non_null(:string)
  field :display_name, non_null(:string)
  field :data_type, non_null(:string)
  field :value_text, non_null(:string)
end
```

In `lib/product_compare_web/resolvers/catalog_resolver.ex`, add `alias ProductCompare.Specs`, then add:

```elixir
def current_attributes(%{id: product_id}, _args, _resolution) do
  attributes =
    product_id
    |> Specs.list_current_attributes_for_product()
    |> Enum.map(&format_current_attribute/1)

  {:ok, attributes}
end

defp format_current_attribute(%{attribute: attribute, claim: claim}) do
  %{
    code: attribute.code,
    display_name: attribute.display_name,
    data_type: Atom.to_string(attribute.data_type),
    value_text: format_claim_value(claim)
  }
end

defp format_claim_value(%{value_bool: value}) when is_boolean(value) do
  if value, do: "Yes", else: "No"
end

defp format_claim_value(%{value_int: value}) when is_integer(value), do: Integer.to_string(value)

defp format_claim_value(%{value_num: %Decimal{} = value, unit: unit}) do
  value
  |> Decimal.normalize()
  |> Decimal.to_string(:normal)
  |> append_unit(unit)
end

defp format_claim_value(%{value_text: value}) when is_binary(value), do: value
defp format_claim_value(%{value_date: %Date{} = value}), do: Date.to_iso8601(value)
defp format_claim_value(%{value_ts: %DateTime{} = value}), do: DateTime.to_iso8601(value)
defp format_claim_value(%{enum_option: %{label: value}}) when is_binary(value), do: value
defp format_claim_value(%{value_json: value}) when is_map(value), do: Jason.encode!(value)
defp format_claim_value(_claim), do: ""

defp append_unit(value, %{symbol: symbol}) when is_binary(symbol) and symbol != "",
  do: "#{value} #{symbol}"

defp append_unit(value, %{code: code}) when is_binary(code) and code != "", do: "#{value} #{code}"
defp append_unit(value, _unit), do: value
```

- [ ] **Step 5: Run the backend test to verify it passes**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/product_compare/specs.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/catalog_queries_test.exs
git commit -m "feat(graphql): expose current product attributes"
```

---

### Task 2: Render Product Attributes On Product Detail

**Files:**
- Modify: `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- Modify: `assets/src/routes/products/detail.tsx`
- Test: `assets/src/routes/products/__tests__/detail.route.test.tsx`
- Generated: `assets/src/__generated__/ProductDetailRouteQuery.graphql.ts`
- Generated: `assets/schema.graphql`

- [ ] **Step 1: Write the failing frontend route test**

In `assets/src/routes/products/__tests__/detail.route.test.tsx`, first add `currentAttributes: []` to the `DETAIL_PRODUCT` constant:

```ts
const DETAIL_PRODUCT = {
  id: "UHJvZHVjdDox",
  name: "Detail Product",
  slug: "detail-product",
  description: "A narrow product detail baseline.",
  brand: {
    id: "brand-1",
    name: "Acme"
  },
  currentAttributes: []
} as const;
```

Then change `mockProductAndOffersQueries` so tests can supply a product override:

```ts
function mockProductAndOffersQueries(offersResult: unknown, product = DETAIL_PRODUCT) {
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === productQueryRef) {
      return {
        product
      };
    }

    if (queryRef === offersQueryRef) {
      if (offersResult instanceof Error) {
        throw offersResult;
      }

      return offersResult;
    }

    throw new Error(`Unexpected preloaded query ref: ${String(queryRef)}`);
  });
}
```

Add these tests after `renders product detail and active offers from Relay route queries`:

```tsx
test("renders product specifications from current attributes", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(buildOffersData([]), {
    ...DETAIL_PRODUCT,
    currentAttributes: [
      {
        code: "refresh-rate",
        displayName: "Refresh rate",
        dataType: "numeric",
        valueText: "144 Hz"
      },
      {
        code: "panel-type",
        displayName: "Panel type",
        dataType: "text",
        valueText: "OLED"
      }
    ]
  });

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Specifications" })).toBeInTheDocument();
  expect(screen.getByText("Refresh rate")).toBeVisible();
  expect(screen.getByText("144 Hz")).toBeVisible();
  expect(screen.getByText("Panel type")).toBeVisible();
  expect(screen.getByText("OLED")).toBeVisible();
});

test("links from product detail to compare with the current product selected", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "ready",
    productQuery: PRODUCT_QUERY_DESCRIPTOR,
    offers: {
      status: "ready",
      query: OFFERS_QUERY_DESCRIPTOR
    }
  });
  mockRouteQueryRefs();
  mockProductAndOffersQueries(buildOffersData([]));

  render(
    <MemoryRouter>
      <ProductDetailRoute />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Compare this product" })).toHaveAttribute(
    "href",
    "/compare?slug=detail-product"
  );
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
```

Expected: FAIL because the query and route do not render `currentAttributes` or the compare link.

- [ ] **Step 3: Add attributes to the Relay query**

Update `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`:

```ts
export const productDetailRouteQuery = graphql`
  query ProductDetailRouteQuery($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      brand {
        id
        name
      }
      currentAttributes {
        code
        displayName
        dataType
        valueText
      }
    }
  }
`;
```

- [ ] **Step 4: Render the product detail specs and compare link**

In `assets/src/routes/products/detail.tsx`, import `Link`:

```ts
import { Link, useLoaderData } from "react-router-dom";
```

Add this near the product title/description before Active offers:

```tsx
<p>
  <Link to={`/compare?slug=${encodeURIComponent(product.slug)}`}>Compare this product</Link>
</p>
<ProductSpecifications attributes={product.currentAttributes} />
```

Add this component below `ProductDetail`:

```tsx
function ProductSpecifications({
  attributes
}: {
  attributes: ReadonlyArray<{
    code: string;
    displayName: string;
    valueText: string;
  }>;
}) {
  if (attributes.length === 0) {
    return (
      <section>
        <h2>Specifications</h2>
        <p>No product attributes available yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Specifications</h2>
      <dl>
        {attributes.map((attribute) => (
          <div key={attribute.code}>
            <dt>{attribute.displayName}</dt>
            <dd>{attribute.valueText}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Regenerate Relay artifacts and verify the route test passes**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx
```

Expected: Relay generation succeeds and the product detail route test passes.

- [ ] **Step 6: Commit**

```bash
git add assets/schema.graphql assets/src/__generated__/ProductDetailRouteQuery.graphql.ts assets/src/routes/products/queries/ProductDetailRouteQuery.ts assets/src/routes/products/detail.tsx assets/src/routes/products/__tests__/detail.route.test.tsx
git commit -m "feat(frontend): show product specifications"
```

---

### Task 3: Add Compare Entry Points From Browse And Product Detail

**Files:**
- Modify: `assets/src/routes/catalog/browse.tsx`
- Test: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`

- [ ] **Step 1: Write the failing browse route test**

In `assets/src/routes/catalog/__tests__/browse.route.test.tsx`, extend the existing `renders browse products from the Relay route query` test with this assertion:

```tsx
expect(screen.getByRole("link", { name: "Compare Catalog First" })).toHaveAttribute(
  "href",
  "/compare?slug=catalog-first"
);
expect(screen.getByRole("link", { name: "Compare Catalog Second" })).toHaveAttribute(
  "href",
  "/compare?slug=catalog-second"
);
```

Also add the same expectation to the recovered-query assertion in `resets the local unavailable state when fresh loader data arrives`:

```tsx
expect(screen.getByRole("link", { name: "Compare Recovered Product" })).toHaveAttribute(
    "href",
    "/compare?slug=recovered-product"
);
```

- [ ] **Step 2: Run the browse route test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx
```

Expected: FAIL because browse cards do not have compare links.

- [ ] **Step 3: Add the browse compare link**

In `assets/src/routes/catalog/browse.tsx`, add a compare link inside each product `<li>`:

```tsx
<p>
  <Link to={`/compare?slug=${encodeURIComponent(product.slug)}`}>
    Compare {product.name}
  </Link>
</p>
```

Keep the existing product detail link unchanged.

- [ ] **Step 4: Run the browse route test to verify it passes**

Run:

```bash
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/__tests__/browse.route.test.tsx
git commit -m "feat(frontend): link browse products into compare"
```

---

### Task 4: Add An Empty Compare Page Product Selector

**Files:**
- Create: `assets/src/routes/compare/queries/CompareProductPickerQuery.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Test: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Generated: `assets/src/__generated__/CompareProductPickerQuery.graphql.ts`

- [ ] **Step 1: Write the failing compare empty-state test**

In `assets/src/routes/compare/__tests__/compare.route.test.tsx`, update the React Relay mock setup:

```ts
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
```

Add `useLazyLoadQueryMock` to the hoisted mocks:

```ts
useLazyLoadQueryMock: vi.fn(),
```

Return it from the `react-relay` mock:

```ts
useLazyLoadQuery: useLazyLoadQueryMock,
```

Add this constant near the other mocked hooks:

```ts
const mockedUseLazyLoadQuery = vi.mocked(useLazyLoadQuery);
```

Reset it in `beforeEach`:

```ts
useLazyLoadQueryMock.mockReset();
```

Then add this test after `renders an empty-state message when no products are selected`:

```tsx
test("empty compare page lets users choose products without editing the URL", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: [
        {
          node: {
            id: "Product:monitor-a",
            name: "Monitor A",
            slug: "monitor-a",
            brand: { id: "Brand:displayco", name: "DisplayCo" }
          }
        },
        {
          node: {
            id: "Product:monitor-b",
            name: "Monitor B",
            slug: "monitor-b",
            brand: { id: "Brand:viewco", name: "ViewCo" }
          }
        }
      ]
    }
  });

  render(<CompareRoute />);

  expect(screen.getByRole("heading", { name: "Choose products" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Compare Monitor A" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-a"
  );
  expect(screen.getByRole("link", { name: "Compare Monitor B" })).toHaveAttribute(
    "href",
    "/compare?slug=monitor-b"
  );
});
```

Also add an empty picker result test:

```tsx
test("empty compare page handles an empty product picker", () => {
  mockedUseLoaderData.mockReturnValue({
    status: "empty",
    slugs: []
  });
  mockedUseLazyLoadQuery.mockReturnValue({
    products: {
      edges: []
    }
  });

  render(<CompareRoute />);

expect(screen.getByText("No products are available to compare yet.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the compare route test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx
```

Expected: FAIL because the empty compare page does not query or render products.

- [ ] **Step 3: Add the product picker query**

Create `assets/src/routes/compare/queries/CompareProductPickerQuery.ts`:

```ts
import { graphql } from "react-relay";

export const compareProductPickerQuery = graphql`
  query CompareProductPickerQuery($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          name
          slug
          brand {
            id
            name
          }
        }
      }
    }
  }
`;
```

- [ ] **Step 4: Render the empty compare selector**

In `assets/src/routes/compare/index.tsx`, import `useLazyLoadQuery` and the generated query:

```ts
import { useLoaderData } from "react-router-dom";
import { useLazyLoadQuery, useMutation, usePreloadedQuery } from "react-relay";
import compareProductPickerQuery, {
  type CompareProductPickerQuery
} from "../../__generated__/CompareProductPickerQuery.graphql";
```

Replace the empty state body with:

```tsx
{loaderData.status === "empty" ? <CompareProductPicker /> : null}
```

Add this component:

```tsx
function CompareProductPicker() {
  const data = useLazyLoadQuery<CompareProductPickerQuery>(
    compareProductPickerQuery,
    { first: 12 },
    { fetchPolicy: "store-or-network" }
  );
  const products = data.products.edges.map(({ node }) => node);

  if (products.length === 0) {
    return <p>No products are available to compare yet.</p>;
  }

  return (
    <section>
      <h2>Choose products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.brand.name}</p>
            <a href={`/compare?slug=${encodeURIComponent(product.slug)}`}>
              Compare {product.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Regenerate Relay artifacts and verify the compare route test passes**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx
```

Expected: Relay generation succeeds and the compare route test passes.

- [ ] **Step 6: Commit**

```bash
git add assets/src/routes/compare/queries/CompareProductPickerQuery.ts assets/src/__generated__/CompareProductPickerQuery.graphql.ts assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): add compare product picker"
```

---

### Task 5: Render Attributes On Compare Cards

**Files:**
- Modify: `assets/src/routes/compare/index.tsx`
- Test: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

- [ ] **Step 1: Write the failing compare-ready test**

In `assets/src/routes/compare/__tests__/compare.route.test.tsx`, add `currentAttributes: []` to `DETAIL_PRODUCT` and `SECOND_PRODUCT`, then add this test after `renders compared product cards returned by the route loader`:

```tsx
test("ready compare cards render product attributes", () => {
  mockedUseLoaderData.mockReturnValue(buildReadyCompareLoaderData());
  mockedUsePreloadedQuery.mockImplementation((_query, queryRef) => {
    if (queryRef === DETAIL_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...DETAIL_PRODUCT,
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              dataType: "numeric",
              valueText: "144 Hz"
            }
          ]
        }
      };
    }

    if (queryRef === SECOND_PRODUCT_QUERY_REF) {
      return {
        product: {
          ...SECOND_PRODUCT,
          currentAttributes: [
            {
              code: "refresh-rate",
              displayName: "Refresh rate",
              dataType: "numeric",
              valueText: "165 Hz"
            }
          ]
        }
      };
    }

    throw new Error(`Unexpected query ref: ${String(queryRef)}`);
  });

  render(<CompareRoute />);

  expect(screen.getByText("144 Hz")).toBeVisible();
  expect(screen.getByText("165 Hz")).toBeVisible();
  expect(screen.getAllByText("Refresh rate")).toHaveLength(2);
});
```

- [ ] **Step 2: Run the compare route test to verify it fails**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx
```

Expected: FAIL because ready compare cards do not render `currentAttributes`.

- [ ] **Step 3: Add attribute rendering to compare cards**

In `assets/src/routes/compare/index.tsx`, inside `CompareProductCard`, render specs after the description:

```tsx
<CompareProductAttributes attributes={product.currentAttributes} />
```

Add this component:

```tsx
function CompareProductAttributes({
  attributes
}: {
  attributes: ReadonlyArray<{
    code: string;
    displayName: string;
    valueText: string;
  }>;
}) {
  if (attributes.length === 0) {
    return <p>No product attributes available yet.</p>;
  }

  return (
    <dl>
      {attributes.map((attribute) => (
        <div key={attribute.code}>
          <dt>{attribute.displayName}</dt>
          <dd>{attribute.valueText}</dd>
        </div>
      ))}
    </dl>
  );
}
```

Do not build a full aligned comparison matrix in this task. The demo requirement is that selected products display their attributes once they are selected.

- [ ] **Step 4: Run the compare route test to verify it passes**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/src/routes/compare/index.tsx assets/src/routes/compare/__tests__/compare.route.test.tsx
git commit -m "feat(frontend): show attributes on compare cards"
```

---

### Task 6: Verify The Full Demo Slice And Update Queue Docs

**Files:**
- Create: `docs/work/frontend-product-comparison-demo-parity.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: Run focused backend and frontend verification**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
cd assets && bun run relay
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Run broader frontend check**

Run:

```bash
cd assets && bun run check
```

Expected: PASS.

- [ ] **Step 3: Create the lane work doc**

Create `docs/work/frontend-product-comparison-demo-parity.md`:

```markdown
# Frontend Product Comparison Demo Parity

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-05-31 after focused comparison demo parity verification
- Implementation plan: `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`
- Objective: make product comparison demoable from the UI by exposing current product attributes and adding visible compare selection paths.

## Completed Scope

- GraphQL `Product.currentAttributes` exposes selected current product claims in a demo-friendly display format.
- Product detail pages render a Specifications section and link the current product into `/compare`.
- Browse product cards include compare links.
- Empty `/compare` renders a small product selector so users can start a comparison without hand-editing query params.
- Ready `/compare` cards render selected products' current attributes.

## Verification

- `mix test test/product_compare_web/graphql/catalog_queries_test.exs`
- `cd assets && bun run relay`
- `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- `git diff --check`

## Next Batch

- Status: none queued
- Batch: none
- Follow-up candidates:
  - Build an aligned comparison matrix for attributes shared across selected products.
  - Add a persistent compare tray across browse/detail pages.
  - Add demo parity for API token management, affiliate admin setup, revenue reporting, and merchant discovery.
```

- [ ] **Step 4: Update shared queue and architecture docs at the milestone boundary**

Update `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` to reflect:

- this frontend lane is completed,
- product comparison is now demoable without manual URL editing,
- product detail and compare pages now render current product attributes,
- the next non-ingestion demo-parity candidates are API token management, affiliate/admin setup, revenue reporting, and merchant discovery.

Do this only after the code and tests above pass. Keep the update bundled with the implementation diff; do not make a standalone checklist-only PR.

- [ ] **Step 5: Final verification**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs
cd assets && bun run check
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add ARCHITECTURE.md docs/work/frontend-product-comparison-demo-parity.md docs/work/index.md docs/plans/NOW.md docs/plans/INDEX.md docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md lib/product_compare/specs.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/catalog_queries_test.exs assets/schema.graphql assets/src/__generated__ assets/src/routes/catalog assets/src/routes/products assets/src/routes/compare
git commit -m "feat(frontend): make product comparison demoable"
```

---

## Completion Criteria

- A user can start a comparison from `/products`, `/products/:slug`, or the empty `/compare` page.
- A user can compare up to 3 selected products without editing the URL manually.
- Product detail pages display current product attributes when backend current claims exist.
- Compare cards display each selected product's current attributes.
- Existing compare save behavior remains intact.
- Existing product offer rendering remains intact.
- Backend GraphQL tests cover `Product.currentAttributes`.
- Focused frontend route tests and `cd assets && bun run check` pass.

## Self-Review

- Spec coverage: covers compare selection, product detail attributes, compare attributes, backend GraphQL field, Relay generation, focused tests, broad frontend check, and queue-doc updates.
- Placeholder scan: no placeholder work remains; every implementation task has exact files, code shape, and verification commands.
- Type consistency: GraphQL field uses Absinthe snake_case `current_attributes` and Relay camelCase `currentAttributes`; frontend components use `code`, `displayName`, and `valueText` consistently.
