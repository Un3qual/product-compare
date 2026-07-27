# Ranked Catalog Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make catalog text searches deterministic and relevance-ranked, including exact validated GTIN lookup and typo-tolerant matching, while preserving every explicit sort, filter, Relay pagination, and URL contract.

**Architecture:** Enable PostgreSQL `pg_trgm` and add expression indexes for the text fields that participate in typo-tolerant search. A focused `ProductCompare.Catalog.Search` module owns the matching predicate and relevance order, while `ProductCompare.Catalog.Filtering` continues to compose taxonomy, typed-claim, use-case, and explicit-sort policy. GraphQL normalizes query-without-sort to relevance, and the catalog route presents the same policy without serializing redundant `sort=RELEVANCE`.

**Tech Stack:** Elixir, Ecto, PostgreSQL 18, `pg_trgm`, Absinthe GraphQL, ExUnit, React 19, TypeScript, React Router, Relay, Vitest, Testing Library.

## Global Constraints

- Do not claim implementation until the coordinator either leaves at least three other independently shippable `ready` rows in `docs/work/index.md` or records an explicit one-time reserve waiver.
- Treat this as one cross-stack queue outcome. The database, backend, GraphQL, Relay, and frontend tasks below are internal milestone commits, not separate queue rows.
- The maximum catalog query length remains exactly `100` characters.
- The trigram similarity threshold is the code constant `0.35`.
- Trigram matching is disabled when `String.length(query) < 3`.
- Only `scheme = "gtin"` and `verification_status = "validated"` identifiers can receive the exact-identifier tier.
- Normalize possible GTIN queries only through `ProductCompare.Catalog.GTIN.normalize/1`.
- Do not introduce an MPN normalizer or make MPN a separate search authority.
- Relevance tiers are, in order: exact validated GTIN or model number; exact name or slug; text prefix; text contains; trigram; description contains.
- Relevance ties use greatest text similarity descending, normalized product name ascending, then product ID ascending.
- A nonblank query with no explicit sort uses relevance.
- Explicit `RELEVANCE` with a nonblank query uses relevance.
- Explicit `ID_ASC`, `NAME_ASC`, `BRAND_NAME_ASC`, or `NEWEST` overrides relevance while retaining the search predicate.
- `RELEVANCE` without a nonblank query falls back to catalog ID order.
- Do not expose score, match reason, or excerpts through GraphQL or React.
- Preserve taxonomy filters, typed specification filters, use-case filters, result-count/facet parity, page-size state, compare slugs, and deterministic Relay cursors.
- Preserve literal wildcard behavior for `%`, `_`, and backslash.
- Do not assert PostgreSQL planner node strings or private SQL fragments in tests.
- Do not add autocomplete, suggestions, highlighting, analytics, external search infrastructure, a denormalized search table, or unrelated refactors.

---

## File Structure

### New files

- `priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs`
  - Enables `pg_trgm`.
  - Adds lowercased GIN trigram indexes for `products.name`, `products.slug`,
    `products.model_number`, and `brands.name`.
- `lib/product_compare/catalog/search.ex`
  - Owns search-term preparation, the matching predicate, validated-GTIN
    lookup, the six relevance tiers, and deterministic relevance ordering.
- `test/product_compare/catalog/search_test.exs`
  - Covers the search module directly with database-backed behavior tests.

### Existing backend and GraphQL files

- `lib/product_compare/catalog/filtering.ex`
  - Delegates text matching and relevance ordering to `Catalog.Search`.
  - Retains all non-search filter composition and named explicit sorts.
- `lib/product_compare_web/resolvers/catalog/input_normalization.ex`
  - Accepts `RELEVANCE` and makes it the normalized default for nonblank
    queries without an explicit sort.
- `lib/product_compare_web/schema/types/catalog.ex`
  - Adds `RELEVANCE` to `ProductSort`.
- `test/product_compare_web/graphql/catalog_queries_test.exs`
  - Covers implied/explicit relevance, explicit-sort overrides, typed filters,
    and tied cursor pages through GraphQL.
- `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
  - Proves product results and filter metadata use the same search set.
- `test/product_compare_web/graphql/dataloader_batching_test.exs`
  - Proves implicit and explicit relevance normalize to one request-scoped
    loader key.
- `assets/schema.graphql`
  - Remains the exact SDL snapshot of the live Absinthe schema.

### Existing frontend files

- `assets/src/routes/catalog/filters.ts`
  - Adds the relevance sort and contextual URL/default normalization.
- `assets/src/routes/catalog/paths.ts`
  - Omits implicit relevance, preserves explicit catalog order during search,
    and keeps all existing filter and compare parameters.
- `assets/src/routes/catalog/BrowseRoute.tsx`
  - Passes the full normalized filter state when canonicalizing compare links.
- `assets/src/routes/catalog/filter-summary.ts`
  - Keeps default relevance out of active-filter chips.
- `assets/src/routes/catalog/CatalogFilterForm.tsx`
  - Shows Relevance only for an active search and submits only non-default
    explicit sort values.
- `assets/test/routes/catalog/catalog-sort-input.test.ts`
  - Covers the expanded sort value parser.
- `assets/test/routes/catalog/paths.test.ts`
  - Covers canonical implicit/explicit search-sort URLs.
- `assets/test/routes/catalog/filter-summary.test.ts`
  - Covers relevance-summary omission and query removal.
- `assets/test/routes/catalog/browse.route.test.tsx`
  - Covers normalized Relay variables, form options, submissions, links, and
    stale-cursor removal.
- `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
  - Relay-generated `ProductSort` union containing `RELEVANCE`.

### Evidence file

- `docs/work/frontend-catalog-browse.md`
  - Records the ranked-search dispatch, milestone commits, and exact final
    verification evidence.

---

### Task 1: Add the PostgreSQL search capability and focused ranking owner

**Files:**

- Create: `priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs`
- Create: `lib/product_compare/catalog/search.ex`
- Create: `test/product_compare/catalog/search_test.exs`

**Interfaces:**

- Consumes:
  - A query with named binding `:product`.
  - `ProductCompare.Catalog.GTIN.normalize/1`.
  - `ProductCompareSchemas.Catalog.ProductIdentifier`.
- Produces:
  - `ProductCompare.Catalog.Search.apply_match/2`
    - Signature: `(Ecto.Queryable.t(), String.t() | nil) :: Ecto.Query.t()`
    - Adds only matching joins and predicates; it never orders.
  - `ProductCompare.Catalog.Search.order_by_relevance/2`
    - Signature: `(Ecto.Queryable.t(), String.t()) :: Ecto.Query.t()`
    - Applies the six tiers and all deterministic tie-breakers.

- [ ] **Step 1: Write the failing database-backed search behavior tests**

Create `test/product_compare/catalog/search_test.exs` with a non-async
`ProductCompare.DataCase`. Import `Ecto.Query`, alias `Catalog`, `Search`,
`Repo`, `SpecsFixtures`, and `Product`, and add these helpers:

```elixir
defp ranked_search(query) do
  Product
  |> from(as: :product)
  |> Search.apply_match(query)
  |> Search.order_by_relevance(query)
  |> Repo.all()
end

defp product(attrs) do
  SpecsFixtures.product_fixture(
    Map.put_new_lazy(attrs, :slug, fn ->
      "ranked-search-#{System.unique_integer([:positive])}"
    end)
  )
end

defp create_identifier!(product, status, normalized_value \\ "4006381333931") do
  {:ok, identifier} =
    Catalog.create_product_identifier(%{
      product_id: product.id,
      scheme: "gtin",
      normalized_value: normalized_value,
      display_value: normalized_value,
      verification_status: status
    })

  identifier
end
```

Add one tier-order test using query `"aurora"` and these records in deliberately
different insertion order:

```elixir
description =
  product(%{
    name: "Description Only",
    description: "Designed for aurora workflows"
  })

typo = product(%{name: "Aurorra"})
contains = product(%{name: "Display for Aurora Creators"})
prefix = product(%{name: "Aurora Pro Display"})
slug_exact = product(%{name: "Beacon", slug: "aurora"})
name_exact = product(%{name: "Aurora"})
model_exact = product(%{name: "Zulu Model", model_number: "AURORA"})

assert Enum.map(ranked_search("aurora"), & &1.id) == [
         model_exact.id,
         name_exact.id,
         slug_exact.id,
         prefix.id,
         contains.id,
         typo.id,
         description.id
       ]
```

Add a validated-GTIN authority test:

```elixir
validated = product(%{name: "Validated Identifier"})
unverified = product(%{name: "Unverified Identifier"})
rejected = product(%{name: "Rejected Identifier"})

create_identifier!(validated, "validated")
create_identifier!(unverified, "unverified")
create_identifier!(rejected, "rejected")

assert Enum.map(ranked_search("4006-3813-3393-1"), & &1.id) == [validated.id]
```

Add a threshold and minimum-length test. The direct similarity assertion
documents why the selected fixtures lie on opposite sides of the contract
without asserting an execution plan:

```elixir
monitor = product(%{name: "Monitor"})

%Postgrex.Result{rows: [[above_threshold, below_threshold]]} =
  Repo.query!(
    "SELECT similarity(lower($1), lower($2)), similarity(lower($1), lower($3))",
    ["Monitor", "Monitr", "Moxyz"]
  )

assert above_threshold >= 0.35
assert below_threshold < 0.35
assert Enum.map(ranked_search("monitr"), & &1.id) == [monitor.id]
assert ranked_search("moxyz") == []
assert Enum.map(ranked_search("mo"), & &1.id) == [monitor.id]
assert ranked_search("mt") == []
```

Add a brand-only typo test so the left join remains part of both matching and
ranking:

```elixir
{:ok, brand} = Catalog.upsert_brand(%{name: "Logitech"})
brand_product = product(%{name: "Conference Camera", brand_id: brand.id})

assert Enum.map(ranked_search("logitec"), & &1.id) == [brand_product.id]
```

Add deterministic tie and literal-wildcard tests:

```elixir
first = product(%{name: "Same Search Name", description: "literal %_\\ token"})
second = product(%{name: "Same Search Name", description: "literal %_\\ token"})

assert Enum.map(ranked_search("same search"), & &1.id) == [first.id, second.id]
assert Enum.map(ranked_search("%_\\") , & &1.id) == [first.id, second.id]
assert ranked_search("!!!") == []
```

- [ ] **Step 2: Run the new test and verify the missing search owner fails**

Run:

```bash
mix test test/product_compare/catalog/search_test.exs
```

Expected: compilation fails because
`ProductCompare.Catalog.Search.apply_match/2` and
`order_by_relevance/2` do not exist.

- [ ] **Step 3: Add the reversible migration**

Create `priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs`:

```elixir
defmodule ProductCompare.Repo.Migrations.AddRankedCatalogSearch do
  use Ecto.Migration

  def up do
    execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    execute("""
    CREATE INDEX products_search_name_trgm_idx
    ON products USING gin (lower(name) gin_trgm_ops)
    """)

    execute("""
    CREATE INDEX products_search_slug_trgm_idx
    ON products USING gin (lower(slug) gin_trgm_ops)
    """)

    execute("""
    CREATE INDEX products_search_model_number_trgm_idx
    ON products USING gin (lower(model_number) gin_trgm_ops)
    """)

    execute("""
    CREATE INDEX brands_search_name_trgm_idx
    ON brands USING gin (lower(name) gin_trgm_ops)
    """)
  end

  def down do
    execute("DROP INDEX IF EXISTS brands_search_name_trgm_idx")
    execute("DROP INDEX IF EXISTS products_search_model_number_trgm_idx")
    execute("DROP INDEX IF EXISTS products_search_slug_trgm_idx")
    execute("DROP INDEX IF EXISTS products_search_name_trgm_idx")
  end
end
```

The down migration intentionally retains the shared `pg_trgm` extension after
removing this feature's indexes.

- [ ] **Step 4: Apply the test migration**

Run:

```bash
MIX_ENV=test mix ecto.migrate
```

Expected: the migration creates the extension and four indexes successfully.

- [ ] **Step 5: Implement `ProductCompare.Catalog.Search`**

Create `lib/product_compare/catalog/search.ex` with these constants and public
clauses:

```elixir
defmodule ProductCompare.Catalog.Search do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.GTIN
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.ProductIdentifier

  @similarity_threshold 0.35
  @minimum_trigram_length 3

  @spec apply_match(Ecto.Queryable.t(), String.t() | nil) :: Ecto.Query.t()
  def apply_match(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)

    query
    |> ensure_brand_join()
    |> where(^match_expression(terms))
  end

  def apply_match(query, _value), do: query

  @spec order_by_relevance(Ecto.Queryable.t(), String.t()) :: Ecto.Query.t()
  def order_by_relevance(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)
    order_expressions = [
      asc: relevance_tier(terms),
      desc: greatest_similarity(terms.normalized),
      asc: dynamic([product: product], fragment("lower(?)", product.name)),
      asc: dynamic([product: product], product.id)
    ]

    query
    |> ensure_brand_join()
    |> order_by(^order_expressions)
  end
end
```

Implement `search_terms/1` so it returns exactly:

```elixir
%{
  normalized: String.downcase(value),
  contains_pattern: "%#{escape_like_pattern(String.downcase(value))}%",
  prefix_pattern: "#{escape_like_pattern(String.downcase(value))}%",
  gtin: normalized_gtin(value),
  trigram?: String.length(value) >= @minimum_trigram_length
}
```

Implement `normalized_gtin/1` as `normalized` for
`{:ok, normalized} <- GTIN.normalize(value)` and `nil` for an invalid GTIN.

Implement `escape_like_pattern/1` in this exact order so existing literal
wildcard semantics move intact from `Filtering`:

```elixir
value
|> String.replace("\\", "\\\\")
|> String.replace("%", "\\%")
|> String.replace("_", "\\_")
```

Build the match expression with `dynamic/2` and bound parameters. It is the OR
of:

1. `validated_gtin_expression(terms.gtin)`;
2. case-insensitive exact/prefix/contains predicates over `product.name`,
   `product.slug`, `product.model_number`, and `brand.name`;
3. the four `similarity(lower(coalesce(field, '')), normalized) >= 0.35`
   predicates only when `terms.trigram?` is true; and
4. description contains via `ilike(product.description, contains_pattern)`.

`validated_gtin_expression(nil)` must be `dynamic(false)`. For a normalized
GTIN, use a correlated `EXISTS` subquery:

```elixir
identifier_query =
  from identifier in ProductIdentifier,
    where: identifier.product_id == parent_as(:product).id,
    where: identifier.scheme == "gtin",
    where: identifier.verification_status == "validated",
    where: identifier.normalized_value == ^normalized_gtin

dynamic([product: _product], exists(identifier_query))
```

Build `relevance_tier/1` as a `dynamic/2` `CASE` expression over these exact
booleans:

```text
1: validated GTIN OR lower(model_number) = normalized
2: lower(name) = normalized OR lower(slug) = normalized
3: name/slug/model_number/brand ILIKE prefix_pattern
4: name/slug/model_number/brand ILIKE contains_pattern
5: any enabled text-field similarity >= 0.35
6: description ILIKE contains_pattern
```

Use `coalesce(field, '')` for nullable model, brand, and description values.
Build `greatest_similarity/1` as a `dynamic/2` expression containing:

```sql
greatest(
  similarity(lower(coalesce(product.name, '')), normalized),
  similarity(lower(coalesce(product.slug, '')), normalized),
  similarity(lower(coalesce(product.model_number, '')), normalized),
  similarity(lower(coalesce(brand.name, '')), normalized)
)
```

Every user value must be an Ecto bound parameter. Do not interpolate the query
into fragment SQL strings.

Implement `ensure_brand_join/1` with the existing named-binding pattern:

```elixir
if has_named_binding?(query, :brand) do
  query
else
  join(query, :left, [product: product], brand in Brand,
    on: brand.id == product.brand_id,
    as: :brand
  )
end
```

- [ ] **Step 6: Format and run the focused search tests**

Run:

```bash
mix format priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs lib/product_compare/catalog/search.ex test/product_compare/catalog/search_test.exs
mix test test/product_compare/catalog/search_test.exs
```

Expected: all ranked-search tests pass, including GTIN normalization, all six
tiers, the `0.35` boundary, short-query behavior, stable ties, punctuation,
and literal wildcards.

- [ ] **Step 7: Commit the search core milestone**

```bash
git add priv/repo/migrations/20260727120000_add_ranked_catalog_search.exs lib/product_compare/catalog/search.ex test/product_compare/catalog/search_test.exs
git commit -m "feat: add ranked catalog search query"
```

---

### Task 2: Integrate relevance through filtering, GraphQL, metadata, and Relay connections

**Files:**

- Modify: `lib/product_compare/catalog/filtering.ex:8-105`
- Modify: `lib/product_compare_web/resolvers/catalog/input_normalization.ex:30-107`
- Modify: `lib/product_compare_web/schema/types/catalog.ex:30-35`
- Modify: `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify: `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`
- Modify: `assets/schema.graphql:357-362`

**Interfaces:**

- Consumes:
  - `Catalog.Search.apply_match/2`.
  - `Catalog.Search.order_by_relevance/2`.
- Produces:
  - GraphQL enum value `ProductSort.RELEVANCE`.
  - Normalized filters where `%{query: query}` with omitted sort becomes
    `%{query: query, sort: :relevance}`.
  - The same normalized map for omitted relevance and explicit `RELEVANCE`,
    allowing identical request-scoped loader keys to coalesce.

- [ ] **Step 1: Add failing GraphQL relevance and override tests**

In `test/product_compare_web/graphql/catalog_queries_test.exs`, add a test that
creates products matching `"aurora"` at exact-name, prefix, and contains tiers.
Assert:

```elixir
assert product_slugs(conn, nil, "aurora") == [
         exact.slug,
         prefix.slug,
         contains.slug
       ]

assert product_slugs(conn, "RELEVANCE", "aurora") == [
         exact.slug,
         prefix.slug,
         contains.slug
       ]

assert product_slugs(conn, "ID_ASC", "aurora") ==
         Enum.map(Enum.sort_by([exact, prefix, contains], & &1.id), & &1.slug)
```

Extend the helper without changing existing callers:

```elixir
defp product_slugs(conn, sort), do: product_slugs(conn, sort, nil)

defp product_slugs(conn, sort, query) do
  filters =
    %{}
    |> then(fn filters -> if query, do: Map.put(filters, "query", query), else: filters end)
    |> then(fn filters -> if sort, do: Map.put(filters, "sort", sort), else: filters end)

  response = graphql(conn, products_query(), %{"filters" => filters})

  response
  |> get_in(["data", "products", "edges"])
  |> Enum.map(&get_in(&1, ["node", "slug"]))
end
```

In a separate test, add a no-query fallback assertion using only two products
inserted in ID order:

```elixir
assert product_slugs(conn, "RELEVANCE") == [first.slug, second.slug]
```

Keep the existing assertions for `NAME_ASC`, `BRAND_NAME_ASC`, `NEWEST`, and
`ID_ASC`; add a shared-query fixture to prove each still overrides relevance.

Add a tied relevance cursor test by creating two products with the same name,
searching that name with `first: 1`, then requesting the returned `after`
cursor. Assert the first page is the lower product ID, the second page is the
higher product ID, and `hasPreviousPage` is true on page two.

- [ ] **Step 2: Add failing metadata-set parity and loader-coalescing tests**

In `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`, add one
query that requests both:

```graphql
products(first: 12, filters: $filters) {
  edges { node { id slug } }
}
productFilterMetadata(filters: $filters) {
  resultCount
}
```

Use a typo query, a primary-type taxon filter, and an existing typed numeric
filter. Create one product that matches all three, one that matches query plus
numeric but has the wrong primary type, one that matches query plus type but is
outside the numeric range, and one that matches type plus numeric but not the
query. Assert the returned edge count and `resultCount` are both `1`, and the
edge is the product that satisfies all three predicates.

In `test/product_compare_web/graphql/dataloader_batching_test.exs`, add a query
with these two aliases:

```graphql
implicit: products(first: 1, filters: {query: "aurora"}) {
  edges { node { id slug } }
}
explicit: products(first: 1, filters: {query: "aurora", sort: RELEVANCE}) {
  edges { node { id slug } }
}
```

Wrap the request in `capture_select_queries/1`. Assert both aliases return the
same product/cursor payload and
`catalog_discovery_product_query_budget(queries) == 1`.

- [ ] **Step 3: Run the focused GraphQL tests and verify they fail**

Run:

```bash
mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
```

Expected: failures show that `RELEVANCE` is not in `ProductSort`, omitted sort
still uses ID order, and implicit/explicit relevance do not normalize to the
same loader key.

- [ ] **Step 4: Delegate search matching and relevance ordering from `Filtering`**

In `lib/product_compare/catalog/filtering.ex`:

1. Add `alias ProductCompare.Catalog.Search`.
2. Remove `maybe_apply_text_search/2` and `escape_like_pattern/1`.
3. Change the main pipeline to:

```elixir
search_query = Map.get(filters, :query)

base_query
|> from(as: :product)
|> Search.apply_match(search_query)
|> maybe_apply_primary_type_filter(filters, omitted_group)
|> apply_numeric_filters(filters_for_group(filters, :numeric, omitted_group))
|> apply_bool_filters(filters_for_group(filters, :booleans, omitted_group))
|> apply_enum_filters(filters_for_group(filters, :enums, omitted_group))
|> maybe_apply_use_case_filter(filters, omitted_group)
|> apply_sort(Map.get(filters, :sort), search_query)
```

4. Use these sort clauses:

```elixir
defp apply_sort(query, sort, search_query)
     when sort in [nil, :relevance] and is_binary(search_query) and search_query != "",
     do: Search.order_by_relevance(query, search_query)

defp apply_sort(query, :name_asc, _search_query),
  do: order_by(query, [product: product], asc: product.name, asc: product.id)

defp apply_sort(query, :brand_name_asc, _search_query) do
  query
  |> ensure_brand_join()
  |> order_by(
    [product: product, brand: brand],
    asc: brand.name,
    asc: product.name,
    asc: product.id
  )
end

defp apply_sort(query, :newest, _search_query),
  do: order_by(query, [product: product], desc: product.inserted_at, desc: product.id)

defp apply_sort(query, _sort, _search_query),
  do: order_by(query, [product: product], asc: product.id)
```

This makes direct catalog-context calls with `%{query: query}` relevant even
outside GraphQL, while `RELEVANCE` with no query reaches the ID fallback.

- [ ] **Step 5: Normalize and expose the GraphQL relevance sort**

In `lib/product_compare_web/schema/types/catalog.ex`, add:

```elixir
value(:relevance)
```

In `InputNormalization.filters/1`, pass the normalized query into sort
normalization:

```elixir
with {:ok, query} <- normalize_search_query(Input.fetch_value(filters, :query)),
     {:ok, sort} <- normalize_product_sort(Input.fetch_value(filters, :sort), query),
```

Replace the existing sort normalizer with:

```elixir
defp normalize_product_sort(nil, query) when is_binary(query), do: {:ok, :relevance}
defp normalize_product_sort(nil, _query), do: {:ok, nil}

defp normalize_product_sort(sort, _query)
     when sort in [:relevance, :id_asc, :name_asc, :brand_name_asc, :newest],
     do: {:ok, sort}

defp normalize_product_sort(sort, _query) when is_binary(sort) do
  case sort |> String.trim() |> String.upcase() do
    "RELEVANCE" -> {:ok, :relevance}
    "ID_ASC" -> {:ok, :id_asc}
    "NAME_ASC" -> {:ok, :name_asc}
    "BRAND_NAME_ASC" -> {:ok, :brand_name_asc}
    "NEWEST" -> {:ok, :newest}
    _invalid -> {:error, "invalid product sort"}
  end
end

defp normalize_product_sort(_sort, _query), do: {:error, "invalid product sort"}
```

- [ ] **Step 6: Refresh the canonical schema snapshot**

Run:

```bash
mix absinthe.schema.sdl --schema ProductCompareWeb.Schema assets/schema.graphql
mix test test/product_compare_web/graphql/schema_snapshot_test.exs
```

Expected: `ProductSort` contains `RELEVANCE`, and the SDL snapshot test passes.

- [ ] **Step 7: Run the complete backend search integration suite**

Run:

```bash
mix format lib/product_compare/catalog/filtering.ex lib/product_compare_web/resolvers/catalog/input_normalization.ex lib/product_compare_web/schema/types/catalog.ex test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
mix test test/product_compare/catalog/search_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
```

Expected: all focused backend, GraphQL, metadata, batching, and schema tests
pass.

- [ ] **Step 8: Commit the GraphQL integration milestone**

```bash
git add lib/product_compare/catalog/filtering.ex lib/product_compare_web/resolvers/catalog/input_normalization.ex lib/product_compare_web/schema/types/catalog.ex test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs assets/schema.graphql
git commit -m "feat: expose relevance catalog sorting"
```

---

### Task 3: Normalize relevance and explicit catalog order in frontend route state

**Files:**

- Modify: `assets/src/routes/catalog/filters.ts:1-105,120-150,218-240,395-410`
- Modify: `assets/src/routes/catalog/paths.ts:1-105`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx:100-110`
- Modify: `assets/src/routes/catalog/filter-summary.ts:1-130`
- Modify: `assets/test/routes/catalog/catalog-sort-input.test.ts`
- Modify: `assets/test/routes/catalog/paths.test.ts`
- Modify: `assets/test/routes/catalog/filter-summary.test.ts`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx:622-730`
- Modify: `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`

**Interfaces:**

- Produces:
  - `CatalogProductSort` including `"RELEVANCE"`.
  - `catalogProductSortParam(filters)` returning the sort value that is
    semantically explicit enough to serialize, or `undefined` for the current
    query state's default.
  - `catalogFiltersFromUrl(url)` returning `sort: "RELEVANCE"` for an active
    query with omitted/unsupported sort.
  - `catalogFiltersToProductFiltersInput(filters)` sending the normalized
    relevance value to Relay.
  - `catalogBrowseSearchWithNormalizedSort(search, filters)` using the full
    contextual filter state rather than a sort value alone.

- [ ] **Step 1: Add failing pure sort and URL tests**

In `catalog-sort-input.test.ts`, expand the supported-value table:

```typescript
test.each([
  "RELEVANCE",
  "ID_ASC",
  "NAME_ASC",
  "BRAND_NAME_ASC",
  "NEWEST"
] as const)(
  "catalogProductSortFromValue preserves supported value %s",
  (value) => {
    expect(catalogProductSortFromValue(value)).toBe(value);
  }
);
```

In `browse.route.test.tsx`, add loader assertions for these URLs and normalized
Relay filters:

```text
/products?q=oled
  -> {query: "oled", sort: "RELEVANCE"}

/products?q=oled&sort=RELEVANCE
  -> {query: "oled", sort: "RELEVANCE"}

/products?q=oled&sort=ID_ASC
  -> {query: "oled", sort: "ID_ASC"}

/products?sort=RELEVANCE
  -> no filters variable

/products?q=oled&sort=UNKNOWN
  -> {query: "oled", sort: "RELEVANCE"}
```

Update the existing bounded-query/unsupported-sort expectation from
`{query: boundedQuery}` to
`{query: boundedQuery, sort: "RELEVANCE"}`. Update every other query-only
descriptor in this test file to carry the same normalized relevance value;
explicit `NEWEST`, `NAME_ASC`, `BRAND_NAME_ASC`, and `ID_ASC` expectations stay
unchanged.

In `paths.test.ts`, add:

```typescript
expect(
  catalogBrowsePath(
    { ...EMPTY_FILTERS, query: "oled", sort: "RELEVANCE" },
    12
  )
).toBe("/products?first=12&q=oled");

expect(
  catalogBrowsePath(
    { ...EMPTY_FILTERS, query: "oled", sort: "ID_ASC" },
    12
  )
).toBe("/products?first=12&q=oled&sort=ID_ASC");
```

Also assert named sorts, page size, typed filters, cursor, and compare slugs
retain their existing serialized order.

In `filter-summary.test.ts`, assert:

```typescript
expect(
  catalogFilterSummaryItems(metadata, {
    ...filters,
    query: "monitor",
    sort: "RELEVANCE"
  }).map((item) => item.key)
).not.toContain("sort");

expect(
  catalogFiltersWithout(
    { ...filters, query: "monitor", sort: "RELEVANCE" },
    { kind: "query" }
  )
).toMatchObject({ query: undefined, sort: undefined });
```

- [ ] **Step 2: Run the pure/frontend loader tests and verify they fail**

Run:

```bash
cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/paths.test.ts test/routes/catalog/filter-summary.test.ts test/routes/catalog/browse.route.test.tsx
```

Expected: `RELEVANCE` falls back to `ID_ASC`, query-only Relay variables omit
sort, and explicit `ID_ASC` cannot survive an active query URL.

- [ ] **Step 3: Implement contextual sort normalization in `filters.ts`**

Add `"RELEVANCE"` to `CATALOG_PRODUCT_SORTS` and add the label:

```typescript
RELEVANCE: "Relevance"
```

Keep `catalogProductSortFromValue(value)` as the form-control boundary:
recognized values return themselves and unsupported values return `"ID_ASC"`.
Add a private parser that can distinguish an unsupported URL value:

```typescript
function supportedCatalogProductSort(value: string): CatalogProductSort | null {
  switch (value) {
    case "RELEVANCE":
    case "ID_ASC":
    case "NAME_ASC":
    case "BRAND_NAME_ASC":
    case "NEWEST":
      return value;
    default:
      return null;
  }
}
```

Parse `query` before `sort` in `catalogFiltersFromUrl` and normalize with:

```typescript
function catalogProductSort(
  rawValue: string | null,
  hasQuery: boolean
): CatalogProductSort | null {
  const value = rawValue?.trim() ?? "";
  const parsed = supportedCatalogProductSort(value);

  if (hasQuery) {
    return parsed ?? "RELEVANCE";
  }

  if (parsed === null || parsed === "ID_ASC" || parsed === "RELEVANCE") {
    return null;
  }

  return parsed;
}
```

Call it as:

```typescript
const query = catalogSearchQuery(url.searchParams.get("q"));
const sort = catalogProductSort(url.searchParams.get("sort"), Boolean(query));
```

Export one serialization authority:

```typescript
export function catalogProductSortParam(
  filters: Pick<CatalogFilters, "query" | "sort">
): CatalogProductSort | undefined {
  if (filters.query) {
    return filters.sort === "RELEVANCE" ? undefined : filters.sort;
  }

  return filters.sort === "NAME_ASC" ||
    filters.sort === "BRAND_NAME_ASC" ||
    filters.sort === "NEWEST"
    ? filters.sort
    : undefined;
}
```

Keep `catalogFiltersToProductFiltersInput/1` sending the normalized
`filters.sort`, including `"RELEVANCE"`, so implicit and explicit relevance
produce identical Relay variables.

- [ ] **Step 4: Use the serialization authority in paths and summaries**

In `paths.ts`, import `catalogProductSortParam`. Replace direct `filters.sort`
serialization with:

```typescript
const sortParam = catalogProductSortParam(filters);

if (sortParam) {
  params.set("sort", sortParam);
}
```

Change:

```typescript
catalogBrowseSearchWithNormalizedSort(
  search: string,
  filters: Pick<CatalogFilters, "query" | "sort">
)
```

Delete the existing `sort` parameter, then set only the value returned by
`catalogProductSortParam(filters)`.

In `BrowseRoute.tsx`, pass the full contextual state at the same time as the
signature change:

```typescript
const currentCompareSearch = catalogBrowseSearchWithNormalizedSort(
  location.search,
  activeFilters
);
```

In `filter-summary.ts`, emit a sort summary only when:

```typescript
filters.sort !== undefined && filters.sort !== "RELEVANCE"
```

When removing the query, clear an accompanying relevance sort:

```typescript
function removeQueryFilter(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    query: undefined,
    sort: filters.sort === "RELEVANCE" ? undefined : filters.sort
  };
}
```

- [ ] **Step 5: Regenerate Relay and run the focused state tests**

Run:

```bash
cd assets && bun run relay
cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/paths.test.ts test/routes/catalog/filter-summary.test.ts test/routes/catalog/browse.route.test.tsx
cd assets && bun run typecheck
```

Expected: the contextual loader, Relay-variable, canonical path, existing
filter-preservation, filter-summary, generated enum, and TypeScript checks
pass.

- [ ] **Step 6: Commit the frontend state milestone**

```bash
git add assets/src/routes/catalog/filters.ts assets/src/routes/catalog/paths.ts assets/src/routes/catalog/BrowseRoute.tsx assets/src/routes/catalog/filter-summary.ts assets/test/routes/catalog/catalog-sort-input.test.ts assets/test/routes/catalog/paths.test.ts assets/test/routes/catalog/filter-summary.test.ts assets/test/routes/catalog/browse.route.test.tsx assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts
git commit -m "feat: normalize relevance catalog urls"
```

---

### Task 4: Add the relevance control, regenerate Relay, and close the dispatch

**Files:**

- Modify: `assets/src/routes/catalog/CatalogFilterForm.tsx:91-168`
- Modify: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`

**Interfaces:**

- Consumes:
  - `catalogProductSortParam/1`.
  - Contextually normalized `CatalogFilters`.
  - `catalogBrowseSearchWithNormalizedSort(search, filters)`.
- Produces:
  - An active-search sort control with Relevance selected by default.
  - An unsearched sort control without a Relevance option.
  - GET form data that omits implicit relevance but includes explicit
    `ID_ASC` during a search.
  - Current route behavior and completion evidence.

- [ ] **Step 1: Add failing form and rendered-link tests**

In `browse.route.test.tsx`, add these Testing Library behaviors:

1. Render with `filters.query = "oled"` and `filters.sort = "RELEVANCE"`.
   Assert the sort combobox contains `Relevance`, selects `RELEVANCE`, and
   `new FormData(form).get("sort")` is `null`.
2. Render the unsearched catalog. Assert there is no `Relevance` option and the
   sort value is `ID_ASC`.
3. Render an active search, change the sort combobox to `ID_ASC`, and assert
   form data contains `sort=ID_ASC`.
4. Render an active search, change the searchbox to blank while relevance is
   selected, and assert form data has blank `q` and no `sort`.
5. For each of `NAME_ASC`, `BRAND_NAME_ASC`, and `NEWEST`, assert the selected
   value is submitted unchanged.
6. Render implicit relevance with a next page and compare selection. Assert
   pagination and compare links preserve `q`, page size, filters, and slugs but
   omit `sort=RELEVANCE`.
7. Keep the existing assertion that the GET filter form does not contain the
   current `after` cursor.

- [ ] **Step 2: Run the route test and verify the control contract fails**

Run:

```bash
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx
```

Expected: the existing control shows all sorts without query context, treats
`ID_ASC` as the only default, and cannot serialize search-contextual Catalog
order.

- [ ] **Step 3: Make `CatalogFilterForm` query-aware**

Import `catalogProductSortParam`. Pass the query into the sort field:

```tsx
<SortField query={filters.query} sort={filters.sort} />
```

Replace `SortField` with:

```tsx
function SortField({
  query,
  sort
}: {
  query?: string;
  sort?: CatalogFilters["sort"];
}) {
  const hasQuery = Boolean(query);
  const [selectedSort, setSelectedSort] = useState(
    sort ?? (hasQuery ? "RELEVANCE" : "ID_ASC")
  );
  const availableSorts = hasQuery
    ? CATALOG_PRODUCT_SORTS
    : CATALOG_PRODUCT_SORTS.filter((value) => value !== "RELEVANCE");
  const sortParam = catalogProductSortParam({
    query,
    sort: selectedSort
  });

  return (
    <label>
      Sort products
      <select
        name={sortParam ? "sort" : undefined}
        value={selectedSort}
        onChange={(event) =>
          setSelectedSort(catalogProductSortFromValue(event.currentTarget.value))
        }
      >
        {availableSorts.map((value) => (
          <option key={value} value={value}>
            {catalogProductSortLabel(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
```

The existing route-derived `key={filterFormKey}` remounts this state whenever
normalized filters change.

- [ ] **Step 4: Validate the Relay artifacts**

Run:

```bash
cd assets && bun run relay:check
```

Expected: the Task 3 artifact containing `"RELEVANCE"` is current and
validation exits successfully without changing generated files.

- [ ] **Step 5: Run focused frontend verification**

Run:

```bash
cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/paths.test.ts test/routes/catalog/filter-summary.test.ts test/routes/catalog/browse.route.test.tsx
cd assets && bun run typecheck
```

Expected: all focused catalog tests and TypeScript checks pass.

- [ ] **Step 6: Run full repository verification**

Run:

```bash
mix format --check-formatted
mix typecheck
mix test test/product_compare/catalog/search_test.exs test/product_compare/catalog/filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
cd assets && bun run check
mix ci
git diff --check
```

Expected: formatting, Elixir compilation, focused backend tests, Relay,
TypeScript, all frontend unit/build checks, the full CI gate, and diff hygiene
all pass. If `mix ci` reports a queue-reserve violation, stop and return the
dispatch to the coordinator; do not weaken the validator or split this outcome
into filler rows.

- [ ] **Step 7: Record exact completion evidence in the lane doc**

Append `## Ranked Catalog Search Evidence` to
`docs/work/frontend-catalog-browse.md`. Record:

- the selected `pg_trgm` and tiered-ranking architecture;
- the migration, backend, GraphQL, frontend, and generated-artifact paths;
- the first three milestone commit hashes, with the final milestone hash
  reported in the implementation handoff after this evidence is committed;
- each verification command from Step 7 with its actual exit status and test
  count;
- confirmation that relevance is implicit for query-only URLs;
- confirmation that `sort=ID_ASC` remains explicit during a search;
- confirmation that metadata counts and Relay cursor pages use the identical
  matching set; and
- confirmation that autocomplete, highlighting, score fields, MPN authority,
  and external search infrastructure remain out of scope.

- [ ] **Step 8: Run final diff hygiene after the evidence update**

Run:

```bash
mix format --check-formatted
git diff --check
git status --short
```

Expected: formatting and diff checks pass, and status lists only the Task 4
form, route-test, and lane-evidence files.

- [ ] **Step 9: Commit the completed cross-stack dispatch**

```bash
git add assets/src/routes/catalog/CatalogFilterForm.tsx assets/test/routes/catalog/browse.route.test.tsx docs/work/frontend-catalog-browse.md
git commit -m "feat: finish ranked catalog search"
```

After the commit, run:

```bash
git status --short --branch
git log -4 --oneline
```

Expected: the worktree is clean and the four ranked-search milestone commits
are the newest commits.
