# GraphQL Relay Contract Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the missing root `node(id: ID!)` GraphQL surface for the existing global-ID-backed catalog and pricing entities so backend Relay compatibility improves without touching the frontend lane.

**Architecture:** Keep the current custom global-ID encoder and non-Relay schema layout. Add a narrow root `node` resolver that decodes the existing IDs and dispatches to existing context modules for supported types. Start with public catalog/pricing entities so the first backend batch stays independent from auth/session ownership rules, then extend the surface to owner-scoped entities only after the public path is proven out.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, Postgres, ExUnit

---

## Task 1: Add `node(id: ID!)` for public catalog and pricing entities

**Files:**
- Create: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Create: `test/product_compare_web/graphql/node_query_test.exs`

**Step 1: Write the failing test**

Add focused GraphQL coverage for `Product`, `Brand`, `Merchant`, and `MerchantProduct` node lookups plus invalid ID handling.

```elixir
test "node returns a product for a valid product global id", %{conn: conn} do
  product = SpecsFixtures.product_fixture(%{slug: "node-product", name: "Node Product"})

  assert %{
           "data" => %{
             "node" => %{
               "__typename" => "Product",
               "id" => product_id,
               "slug" => "node-product",
               "name" => "Node Product"
             }
           }
         } = graphql(conn, node_query(), %{"id" => relay_id("Product", product.id)})

  assert product_id == relay_id("Product", product.id)
end
```

```elixir
test "node rejects invalid ids", %{conn: conn} do
  assert %{
           "data" => %{"node" => nil},
           "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
         } = graphql(conn, node_query(), %{"id" => "bad-node-id"})
end
```

**Step 2: Run the test to verify it fails**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: FAIL because the schema does not currently expose a root `node` field or a resolver for generic global-ID lookups.

**Step 3: Write the minimal implementation**

Add read helpers to the existing context modules, then decode the root node ID in a dedicated resolver and fetch only the supported public types.

```elixir
def node(_parent, %{id: id}, resolution) do
  with {:ok, {type, local_id}} <- decode_node_id(id),
       {:ok, record} <- fetch_node(type, local_id, resolution) do
    {:ok, record}
  else
    :not_found -> {:ok, nil}
    {:error, :invalid_id} -> {:error, "invalid node id"}
    {:error, :unsupported_type} -> {:error, "invalid node id"}
  end
end

defp decode_node_id(id) do
  case GlobalId.decode(id) do
    :error ->
      {:error, :invalid_id}

    {:ok, {type, local_id}} when type in [:product, :brand, :merchant, :merchant_product] ->
      {:ok, {type, local_id}}

    {:ok, {_type, _local_id}} ->
      {:error, :unsupported_type}
  end
end

defp fetch_public_node(:product, id) do
  case Catalog.get_product(id) do
    nil -> :not_found
    record -> {:ok, record}
  end
end

defp fetch_public_node(:brand, id) do
  case Catalog.get_brand(id) do
    nil -> :not_found
    record -> {:ok, record}
  end
end

defp fetch_public_node(:merchant, id) do
  case Pricing.get_merchant(id) do
    nil -> :not_found
    record -> {:ok, record}
  end
end

defp fetch_public_node(:merchant_product, id) do
  case Pricing.get_merchant_product(id) do
    nil -> :not_found
    record -> {:ok, record}
  end
end
```

Add the simple context helpers in the Catalog and Pricing modules:

```elixir
# In lib/product_compare/catalog.ex
def get_product(id), do: Repo.get(Product, id)
def get_brand(id), do: Repo.get(Brand, id)
```

```elixir
# In lib/product_compare/pricing.ex
def get_merchant(id), do: Repo.get(Merchant, id)
def get_merchant_product(id), do: Repo.get(MerchantProduct, id)
```

Keep the Task 1 flow explicit: `node/3` should call `decode_node_id/1`, map malformed base64 or unknown global-ID format to `{:error, :invalid_id}`, reject any decoded type outside the public allowlist with `{:error, :unsupported_type}`, and only then call `fetch_public_node/2`. Owner-scoped types stay out of this batch and are added in Task 2.

Expose the field in `schema.ex`:

```elixir
field :node, :node_result do
  arg(:id, non_null(:id))
  resolve(&NodeResolver.node/3)
end
```

Define the `:node_result` union with supported public types and a resolve_type function:

```elixir
union :node_result do
  types([:product, :brand, :merchant, :merchant_product])

  resolve_type(fn
    %ProductCompareSchemas.Catalog.Product{}, _ -> :product
    %ProductCompareSchemas.Catalog.Brand{}, _ -> :brand
    %ProductCompareSchemas.Pricing.Merchant{}, _ -> :merchant
    %ProductCompareSchemas.Pricing.MerchantProduct{}, _ -> :merchant_product
    _, _ -> nil
  end)
end
```

**Step 4: Run the tests to verify they pass**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

**Step 5: Run focused verification**

Run: `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

**Step 6: Commit**

```bash
git add lib/product_compare/catalog.ex lib/product_compare/pricing.ex lib/product_compare_web/schema.ex lib/product_compare_web/resolvers/node_resolver.ex test/product_compare_web/graphql/node_query_test.exs
git commit -m "feat: add graphql node lookup for catalog and pricing records"
```

## Task 2: Extend `node(id: ID!)` to owner-scoped entities

**Files:**
- Modify: `lib/product_compare/catalog.ex`
- Modify: `lib/product_compare/accounts.ex`
- Modify: `lib/product_compare_web/resolvers/node_resolver.ex`
- Modify: `lib/product_compare_web/schema.ex`
- Modify: `test/product_compare_web/graphql/node_query_test.exs`

**Step 1: Write the failing test**

Add coverage for `SavedComparisonSet` and `ApiToken` node lookups under the authenticated owner, and confirm the same IDs resolve to `nil` for other users or anonymous requests.

```elixir
test "node returns nil for a saved comparison set owned by another user", %{conn: conn} do
  owner = AccountsFixtures.user_fixture()
  viewer = AccountsFixtures.user_fixture()
  saved_set = saved_comparison_set_fixture(owner)

  assert %{"data" => %{"node" => nil}} =
           graphql(log_in_user(conn, viewer), node_query(), %{
             "id" => relay_id("SavedComparisonSet", saved_set.entropy_id)
           })
end
```

**Step 2: Run the test to verify it fails**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: FAIL because the resolver only supports public entity types after Task 1.

**Step 3: Write the minimal implementation**

Update the GraphQL union `:node_result` to include `:saved_comparison_set` and `:api_token`:

```elixir
union :node_result do
  types([:product, :brand, :merchant, :merchant_product, :saved_comparison_set, :api_token])

  resolve_type(fn
    %ProductCompareSchemas.Catalog.Product{}, _ -> :product
    %ProductCompareSchemas.Catalog.Brand{}, _ -> :brand
    %ProductCompareSchemas.Pricing.Merchant{}, _ -> :merchant
    %ProductCompareSchemas.Pricing.MerchantProduct{}, _ -> :merchant_product
    %ProductCompareSchemas.Catalog.SavedComparisonSet{}, _ -> :saved_comparison_set
    %ProductCompareSchemas.Accounts.ApiToken{}, _ -> :api_token
    _, _ -> nil
  end)
end
```

Extend `decode_node_id/1` so Task 2's allowlist adds `:saved_comparison_set` and `:api_token`, then dispatch in `NodeResolver.node/3` between public lookups and owner-scoped lookups before fetching records. Keep the owner-scoped path nil-safe for anonymous and unauthorized requests:

```elixir
defp fetch_node(type, local_id, _resolution)
     when type in [:product, :brand, :merchant, :merchant_product] do
  fetch_public_node(type, local_id)
end

defp fetch_owner_scoped_node(:saved_comparison_set, entropy_id, %{context: %{current_user: user}}) do
  case Catalog.get_saved_comparison_set_for_user(user, entropy_id) do
    nil -> {:ok, nil}
    record -> {:ok, record}
  end
end

defp fetch_owner_scoped_node(:saved_comparison_set, _entropy_id, _resolution) do
  {:ok, nil}
end

defp fetch_node(type, local_id, resolution) when type in [:saved_comparison_set, :api_token] do
  fetch_owner_scoped_node(type, local_id, resolution)
end

defp fetch_owner_scoped_node(:api_token, token_entropy_id, %{context: %{current_user: user}}) do
  case Accounts.get_api_token_for_user(user, token_entropy_id) do
    nil -> {:ok, nil}
    record -> {:ok, record}
  end
end

defp fetch_owner_scoped_node(:api_token, _token_entropy_id, _resolution) do
  {:ok, nil}
end
```

Pattern-match `%{context: %{current_user: user}}` in the resolver for the authenticated path. If `current_user` is missing or the record belongs to someone else, return `{:ok, nil}` so owner-scoped node lookups stay invisible to anonymous and cross-user requests.

Implement the context helpers that the resolver calls to verify ownership:

```elixir
# In lib/product_compare/catalog.ex
def get_saved_comparison_set_for_user(user, entropy_id) do
  SavedComparisonSet
  |> where([s], s.entropy_id == ^entropy_id and s.user_id == ^user.id)
  |> preload(items: [:product])
  |> Repo.one()
end
```

```elixir
# In lib/product_compare/accounts.ex
def get_api_token_for_user(user, token_entropy_id) do
  ApiToken
  |> where([t], t.entropy_id == ^token_entropy_id and t.user_id == ^user.id)
  |> Repo.one()
end
```

Make `Catalog.get_saved_comparison_set_for_user/2` mirror the ownership check already used in `delete_saved_comparison_set/2`, and preload `items: [:product]` so the node resolver returns the same shape expected by the saved-comparisons GraphQL surface.

**Step 4: Run the tests to verify they pass**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

**Step 5: Run focused verification**

Run: `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`

Expected: PASS.

**Step 6: Commit**

```bash
git add lib/product_compare/catalog.ex lib/product_compare/accounts.ex lib/product_compare_web/resolvers/node_resolver.ex lib/product_compare_web/schema.ex test/product_compare_web/graphql/node_query_test.exs
git commit -m "feat: extend graphql node lookup to owner-scoped entities"
```

## Task 3: Verify the backend lane and close the work doc

**Files:**
- Modify: `docs/work/graphql-relay-contract-hardening.md`

**Step 1: Update the work doc**

Record the completed batches, verification commands, and any follow-up still deferred after the node surface lands.

**Step 2: Run the backend lane verification**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`

Expected: PASS.

**Step 3: Hand the shared-doc update back to the coordinator**

Do not edit `docs/work/index.md`, `docs/plans/NOW.md`, or `docs/plans/INDEX.md` from the backend lane worker. Instead, leave the backend lane work doc ready for coordinator pickup and record what changed, what passed, and whether the backend lane should move to `completed` or advance to the next backend batch.

**Step 4: Fold the work-doc update into a real milestone commit**

Do not create a standalone docs-only commit for `docs/work/graphql-relay-contract-hardening.md`. If the lane closes in the same session as Task 2, amend that task's final milestone so the work-doc update ships with the related code and verification. Otherwise, leave the work doc ready for coordinator pickup and let the coordinator include it in the next non-doc-only integration commit.