# GraphQL Relay Contract Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the missing root `node(id: ID!)` GraphQL surface for the existing global-ID-backed catalog and pricing entities so backend Relay compatibility improves without touching the frontend lane.

**Architecture:** Keep the current custom global-ID encoder and non-Relay schema layout. Add a narrow root `node` resolver that decodes the existing IDs and dispatches to existing context modules for supported types. Start with public catalog/pricing entities so the first backend batch stays independent from auth/session ownership rules, then extend the surface to owner-scoped entities only after the public path is proven out.

**Tech Stack:** Elixir, Phoenix, Absinthe, Ecto, Postgres, ExUnit

---

### Task 1: Add `node(id: ID!)` for public catalog and pricing entities

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
def node(_parent, %{id: id}, _resolution) do
  with {:ok, {type, local_id}} <- decode_node_id(id),
       {:ok, record} <- fetch_public_node(type, local_id) do
    {:ok, record}
  else
    :not_found -> {:ok, nil}
    {:error, :invalid_id} -> {:error, "invalid node id"}
    {:error, :unsupported_type} -> {:error, "invalid node id"}
  end
end
```

Expose the field in `schema.ex`:

```elixir
field :node, :node_result do
  arg(:id, non_null(:id))
  resolve(&NodeResolver.node/3)
end
```

Represent `:node_result` as a union over the supported public types in this first batch.

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

### Task 2: Extend `node(id: ID!)` to owner-scoped entities

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

Teach `NodeResolver` to fetch owner-scoped nodes through the existing authenticated context, returning `nil` when the viewer is missing or does not own the record.

```elixir
defp fetch_owner_scoped_node(:saved_comparison_set, entropy_id, %{context: %{current_user: user}}) do
  Catalog.get_saved_comparison_set_for_user(user, entropy_id)
end
```

Apply the same pattern to API tokens.

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

### Task 3: Verify the backend lane and close the work doc

**Files:**
- Modify: `docs/work/graphql-relay-contract-hardening.md`

**Step 1: Update the work doc**

Record the completed batches, verification commands, and any follow-up still deferred after the node surface lands.

**Step 2: Run the backend lane verification**

Run: `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`

Expected: PASS.

**Step 3: Hand the shared-doc update back to the coordinator**

Do not edit `docs/work/index.md`, `docs/plans/NOW.md`, or `docs/plans/INDEX.md` from the backend lane worker. Instead, leave the backend lane work doc ready for coordinator pickup and record what changed, what passed, and whether the backend lane should move to `completed` or advance to the next backend batch.

**Step 4: Commit**

```bash
git add docs/work/graphql-relay-contract-hardening.md
git commit -m "docs: close graphql relay contract hardening lane work doc"
```
