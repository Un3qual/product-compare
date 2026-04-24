defmodule ProductCompareWeb.GraphQL.NodeQueryTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Accounts
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompareWeb.Schema

  describe "/api/graphql node query" do
    test "node returns a product for a valid product global id", %{conn: conn} do
      product =
        SpecsFixtures.product_fixture(%{
          slug: "node-product",
          name: "Node Product"
        })

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

    test "node returns a brand for a valid brand global id", %{conn: conn} do
      product = SpecsFixtures.product_fixture()

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "Brand",
                   "id" => brand_id,
                   "name" => brand_name
                 }
               }
             } = graphql(conn, node_query(), %{"id" => relay_id("Brand", product.brand_id)})

      assert brand_id == relay_id("Brand", product.brand_id)
      assert is_binary(brand_name)
    end

    test "node returns a merchant for a valid merchant global id", %{conn: conn} do
      merchant =
        merchant_fixture(%{name: "Node Merchant", domain: unique_domain("node-merchant")})

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "Merchant",
                   "id" => merchant_id,
                   "name" => "Node Merchant",
                   "domain" => domain
                 }
               }
             } = graphql(conn, node_query(), %{"id" => relay_id("Merchant", merchant.id)})

      assert merchant_id == relay_id("Merchant", merchant.id)
      assert domain == merchant.domain
    end

    test "node returns a merchant product for a valid merchant product global id", %{conn: conn} do
      product = SpecsFixtures.product_fixture(%{slug: "node-merchant-product"})
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          product: product,
          is_active: false
        })

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "MerchantProduct",
                   "id" => merchant_product_id,
                   "merchantId" => merchant_id,
                   "productId" => product_id,
                   "isActive" => false
                 }
               }
             } =
               graphql(conn, node_query(), %{
                 "id" => relay_id("MerchantProduct", merchant_product.id)
               })

      assert merchant_product_id == relay_id("MerchantProduct", merchant_product.id)
      assert merchant_id == relay_id("Merchant", merchant.id)
      assert product_id == relay_id("Product", product.id)
    end

    test "node returns a saved comparison set for the authenticated owner", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "node-saved-set-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "node-saved-set-second"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Node saved set",
                 product_ids: [first_product.id, second_product.id]
               })

      conn =
        conn
        |> log_in_user(owner)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "SavedComparisonSet",
                   "id" => saved_set_id,
                   "name" => "Node saved set",
                   "items" => items
                 }
               }
             } =
               graphql(conn, node_query(), %{
                 "id" => relay_id("SavedComparisonSet", saved_set.entropy_id)
               })

      assert saved_set_id == relay_id("SavedComparisonSet", saved_set.entropy_id)

      assert Enum.map(items, &{&1["position"], get_in(&1, ["product", "slug"])}) == [
               {1, first_product.slug},
               {2, second_product.slug}
             ]
    end

    test "node returns nil for a saved comparison set owned by another user", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()
      viewer = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "node-saved-set-cross-user"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Private node set",
                 product_ids: [product.id]
               })

      conn =
        conn
        |> log_in_user(viewer)
        |> put_req_header_same_origin()

      assert %{"data" => %{"node" => nil}} =
               graphql(conn, node_query(), %{
                 "id" => relay_id("SavedComparisonSet", saved_set.entropy_id)
               })
    end

    test "node returns nil for a saved comparison set without authentication", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "node-saved-set-anon"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Anonymous hidden set",
                 product_ids: [product.id]
               })

      assert %{"data" => %{"node" => nil}} =
               graphql(conn, node_query(), %{
                 "id" => relay_id("SavedComparisonSet", saved_set.entropy_id)
               })
    end

    test "node returns nil for owner-scoped ids when current_user is nil" do
      owner = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "node-saved-set-nil-user"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Nil user hidden set",
                 product_ids: [product.id]
               })

      assert {:ok, %{data: %{"node" => nil}}} =
               Absinthe.run(node_query(), Schema,
                 variables: %{"id" => relay_id("SavedComparisonSet", saved_set.entropy_id)},
                 context: %{current_user: nil}
               )
    end

    test "node returns an api token for the authenticated owner", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()

      assert {:ok, %{api_token: api_token}} =
               Accounts.create_api_token(owner.id, %{label: "Node Token"})

      conn =
        conn
        |> log_in_user(owner)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "ApiToken",
                   "id" => api_token_id,
                   "label" => "Node Token",
                   "tokenPrefix" => token_prefix,
                   "revokedAt" => nil
                 }
               }
             } =
               graphql(conn, node_query(), %{
                 "id" => relay_id("ApiToken", api_token.entropy_id)
               })

      assert api_token_id == relay_id("ApiToken", api_token.entropy_id)
      assert token_prefix == api_token.token_prefix
    end

    test "node returns nil for an api token owned by another user", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()
      viewer = AccountsFixtures.user_fixture()

      assert {:ok, %{api_token: api_token}} =
               Accounts.create_api_token(owner.id, %{label: "Owner only"})

      conn =
        conn
        |> log_in_user(viewer)
        |> put_req_header_same_origin()

      assert %{"data" => %{"node" => nil}} =
               graphql(conn, node_query(), %{
                 "id" => relay_id("ApiToken", api_token.entropy_id)
               })
    end

    test "node returns nil for an api token without authentication", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()

      assert {:ok, %{api_token: api_token}} =
               Accounts.create_api_token(owner.id, %{label: "Anonymous hidden token"})

      assert %{"data" => %{"node" => nil}} =
               graphql(conn, node_query(), %{
                 "id" => relay_id("ApiToken", api_token.entropy_id)
               })
    end

    test "node rejects invalid ids", %{conn: conn} do
      assert %{
               "data" => %{"node" => nil},
               "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
             } = graphql(conn, node_query(), %{"id" => "bad-node-id"})
    end

    test "node rejects public ids outside the database bigint range", %{conn: conn} do
      assert %{
               "data" => %{"node" => nil},
               "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
             } =
               graphql(conn, node_query(), %{
                 "id" => relay_id("Product", 9_223_372_036_854_775_808)
               })
    end

    test "node rejects non-positive public ids", %{conn: conn} do
      for local_id <- [0, -1] do
        assert %{
                 "data" => %{"node" => nil},
                 "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
               } = graphql(conn, node_query(), %{"id" => relay_id("Product", local_id)})
      end
    end

    test "node rejects owner-scoped ids with invalid UUID local ids", %{conn: conn} do
      assert %{
               "data" => %{"node" => nil},
               "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
             } = graphql(conn, node_query(), %{"id" => relay_id("ApiToken", "not-a-uuid")})

      assert %{
               "data" => %{"node" => nil},
               "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
             } =
               graphql(conn, node_query(), %{
                 "id" => relay_id("SavedComparisonSet", "not-a-uuid")
               })
    end

    test "node rejects unsupported ids", %{conn: conn} do
      unsupported_id = relay_id("PricePoint", 123)

      assert %{
               "data" => %{"node" => nil},
               "errors" => [%{"message" => "invalid node id", "path" => ["node"]} | _]
             } = graphql(conn, node_query(), %{"id" => unsupported_id})
    end

    test "node exposes the global id directly through the node field", %{conn: conn} do
      product =
        SpecsFixtures.product_fixture(%{
          slug: "node-interface-product",
          name: "Node Interface Product"
        })

      assert %{
               "data" => %{
                 "node" => %{
                   "__typename" => "Product",
                   "id" => product_id
                 }
               }
             } = graphql(conn, node_id_query(), %{"id" => relay_id("Product", product.id)})

      assert product_id == relay_id("Product", product.id)
    end

    test "node returns nil without errors for a valid non-existent public node id", %{conn: conn} do
      response = graphql(conn, node_query(), %{"id" => relay_id("Product", 2_147_483_647)})

      assert %{"data" => %{"node" => nil}} = response
      refute Map.has_key?(response, "errors")
    end
  end

  defp merchant_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      attrs
      |> Map.put_new(:name, "Merchant #{suffix}")
      |> Map.put_new(:domain, "merchant-#{suffix}.example.com")
      |> Pricing.upsert_merchant()

    merchant
  end

  defp merchant_product_fixture(attrs) do
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    product = Map.get(attrs, :product, SpecsFixtures.product_fixture())
    suffix = System.unique_integer([:positive])

    params =
      attrs
      |> Map.drop([:merchant, :product])
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:product_id, product.id)
      |> Map.put_new(:url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:currency, "usd")
      |> Map.put_new(:external_sku, "sku-#{suffix}")
      |> Map.put_new(:is_active, true)

    {:ok, merchant_product} = Pricing.upsert_merchant_product(params)
    merchant_product
  end

  defp node_query do
    """
    query Node($id: ID!) {
      node(id: $id) {
        __typename
        ... on Product {
          id
          slug
          name
        }
        ... on Brand {
          id
          name
        }
        ... on Merchant {
          id
          name
          domain
        }
        ... on MerchantProduct {
          id
          merchantId
          productId
          isActive
        }
        ... on SavedComparisonSet {
          id
          name
          items {
            position
            product {
              id
              slug
            }
          }
        }
        ... on ApiToken {
          id
          label
          tokenPrefix
          revokedAt
        }
      }
    }
    """
  end

  defp node_id_query do
    """
    query NodeId($id: ID!) {
      node(id: $id) {
        __typename
        id
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp relay_id(type, local_id), do: Base.encode64("#{type}:#{local_id}")

  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
