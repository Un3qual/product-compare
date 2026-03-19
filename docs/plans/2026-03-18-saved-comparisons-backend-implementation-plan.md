# Saved Comparisons Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add owner-scoped saved comparison persistence and GraphQL support so authenticated users can save, list, and delete private comparison sets.

**Architecture:** Store saved comparison sets in the catalog domain as a user-owned parent record plus ordered item rows pointing at products. Expose the contract through GraphQL as an authenticated connection query plus typed create/delete mutations that use Relay-style IDs and keep Phoenix session auth as the access boundary.

**Tech Stack:** Elixir, Ecto, Phoenix, Absinthe, PostgreSQL, ExUnit.

---

### Task 1: Add Saved Comparison Persistence

**Files:**
- Create: `priv/repo/migrations/20260318120000_create_saved_comparison_sets.exs`
- Create: `lib/product_compare_schemas/catalog/saved_comparison_set.ex`
- Create: `lib/product_compare_schemas/catalog/saved_comparison_item.ex`
- Modify: `lib/product_compare/catalog.ex`
- Test: `test/product_compare/catalog/saved_comparison_set_test.exs`

**Step 1: Write the failing test**

```elixir
test "create_saved_comparison_set/2 rejects more than three products" do
  user = user_fixture()
  product_ids = Enum.map(1..4, fn index -> SpecsFixtures.product_fixture(%{slug: "saved-set-#{index}"}).id end)

  assert {:error, :too_many_products} =
           Catalog.create_saved_comparison_set(user.id, %{
             name: "Too many",
             product_ids: product_ids
           })
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare/catalog/saved_comparison_set_test.exs`
Expected: FAIL because the saved-comparison schemas and context APIs do not exist yet.

**Step 3: Write minimal implementation**

```elixir
def create_saved_comparison_set(_user_id, %{product_ids: product_ids})
    when is_list(product_ids) and length(product_ids) > 3 do
  {:error, :too_many_products}
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare/catalog/saved_comparison_set_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add priv/repo/migrations/20260318120000_create_saved_comparison_sets.exs lib/product_compare_schemas/catalog/saved_comparison_set.ex lib/product_compare_schemas/catalog/saved_comparison_item.ex lib/product_compare/catalog.ex test/product_compare/catalog/saved_comparison_set_test.exs
git commit -m "feat(compare): add saved comparison persistence"
```

### Task 2: Expose Saved Comparison GraphQL Contract

**Files:**
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Test: `test/product_compare_web/graphql/saved_comparisons_test.exs`

**Step 1: Write the failing test**

```elixir
test "mySavedComparisonSets returns the current user's sets", %{conn: conn} do
  user = user_fixture()

  conn =
    conn
    |> log_in_user(user)
    |> put_req_header_same_origin()

  assert %{"data" => %{"mySavedComparisonSets" => %{"edges" => [_ | _]}}} =
           graphql(conn, my_saved_comparison_sets_query())
end
```

**Step 2: Run test to verify it fails**

Run: `mix test test/product_compare_web/graphql/saved_comparisons_test.exs`
Expected: FAIL because the GraphQL query and mutation fields do not exist yet.

**Step 3: Write minimal implementation**

```elixir
field :my_saved_comparison_sets, :saved_comparison_set_connection do
  arg(:first, :integer)
  arg(:after, :string)

  resolve(&CatalogResolver.my_saved_comparison_sets/3)
end
```

**Step 4: Run test to verify it passes**

Run: `mix test test/product_compare_web/graphql/saved_comparisons_test.exs`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/product_compare/catalog.ex lib/product_compare_web/resolvers/catalog_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/saved_comparisons_test.exs
git commit -m "feat(graphql): add saved comparison set query and mutations"
```
