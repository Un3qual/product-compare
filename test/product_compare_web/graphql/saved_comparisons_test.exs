defmodule ProductCompareWeb.GraphQL.SavedComparisonsTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.SavedComparisonSet

  describe "/api/graphql saved comparisons" do
    test "mySavedComparisonSets returns only the current user's saved sets", %{conn: conn} do
      user = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "saved-query-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "saved-query-second"})
      third_product = SpecsFixtures.product_fixture(%{slug: "saved-query-third"})

      assert {:ok, _saved_set} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Desk setup",
                 product_ids: [second_product.id, first_product.id]
               })

      assert {:ok, _other_saved_set} =
               Catalog.create_saved_comparison_set(other_user.id, %{
                 name: "Other setup",
                 product_ids: [third_product.id]
               })

      conn =
        conn
        |> log_in_user(user)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "mySavedComparisonSets" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "name" => "Desk setup",
                         "items" => items
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => false
                   }
                 }
               }
             } = graphql(conn, my_saved_comparison_sets_query(), %{"first" => 10})

      assert Enum.map(items, &{&1["position"], get_in(&1, ["product", "slug"])}) == [
               {1, second_product.slug},
               {2, first_product.slug}
             ]
    end

    test "mySavedComparisonSets rejects unauthorized requests", %{conn: conn} do
      assert %{
               "data" => %{"mySavedComparisonSets" => nil},
               "errors" => [%{"message" => "unauthorized", "path" => ["mySavedComparisonSets"]} | _]
             } = graphql(conn, my_saved_comparison_sets_query(), %{"first" => 10})
    end

    test "createSavedComparisonSet creates a saved set from relay product ids", %{conn: conn} do
      user = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "saved-create-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "saved-create-second"})

      conn =
        conn
        |> log_in_user(user)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "createSavedComparisonSet" => %{
                   "savedComparisonSet" => %{
                     "name" => "Travel setup",
                     "items" => items
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(conn, create_saved_comparison_set_mutation(), %{
                 "input" => %{
                   "name" => "Travel setup",
                   "productIds" => [
                     relay_id("Product", first_product.id),
                     relay_id("Product", second_product.id)
                   ]
                 }
               })

      assert Enum.map(items, &{&1["position"], get_in(&1, ["product", "slug"])}) == [
               {1, first_product.slug},
               {2, second_product.slug}
             ]

      assert 1 == Repo.aggregate(SavedComparisonSet, :count)
    end

    test "createSavedComparisonSet returns typed errors for invalid product ids", %{conn: conn} do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "saved-create-invalid"})

      conn =
        conn
        |> log_in_user(user)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "createSavedComparisonSet" => %{
                   "savedComparisonSet" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "message" => "invalid product id",
                       "field" => "productIds"
                     }
                   ]
                 }
               }
             } =
               graphql(conn, create_saved_comparison_set_mutation(), %{
                 "input" => %{
                   "name" => "Broken setup",
                   "productIds" => [
                     relay_id("Brand", product.brand_id),
                     relay_id("Product", product.id)
                   ]
                 }
               })
    end

    test "deleteSavedComparisonSet deletes an owned saved set", %{conn: conn} do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "saved-delete-product"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Delete me",
                 product_ids: [product.id]
               })

      conn =
        conn
        |> log_in_user(user)
        |> put_req_header_same_origin()

      saved_set_id = relay_id("SavedComparisonSet", saved_set.entropy_id)

      assert %{
               "data" => %{
                 "deleteSavedComparisonSet" => %{
                   "savedComparisonSet" => %{"id" => ^saved_set_id, "name" => "Delete me"},
                   "errors" => []
                 }
               }
             } =
               graphql(conn, delete_saved_comparison_set_mutation(), %{
                 "savedComparisonSetId" => saved_set_id
               })

      refute Repo.get(SavedComparisonSet, saved_set.id)
    end

    test "deleteSavedComparisonSet returns typed unauthorized errors without a session", %{
      conn: conn
    } do
      assert %{
               "data" => %{
                 "deleteSavedComparisonSet" => %{
                   "savedComparisonSet" => nil,
                   "errors" => [
                     %{"code" => "UNAUTHORIZED", "message" => "unauthorized", "field" => nil}
                   ]
                 }
               }
             } =
               graphql(conn, delete_saved_comparison_set_mutation(), %{
                 "savedComparisonSetId" => relay_id("SavedComparisonSet", Ecto.UUID.generate())
               })
    end

    test "deleteSavedComparisonSet returns not_found for an authenticated non-owner", %{
      conn: conn
    } do
      owner = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "saved-delete-non-owner-product"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(owner.id, %{
                 name: "Owner set",
                 product_ids: [product.id]
               })

      conn =
        conn
        |> log_in_user(other_user)
        |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "deleteSavedComparisonSet" => %{
                   "savedComparisonSet" => nil,
                   "errors" => [
                     %{
                       "code" => "NOT_FOUND",
                       "message" => "saved comparison set not found",
                       "field" => nil
                     }
                   ]
                 }
               }
             } =
               graphql(conn, delete_saved_comparison_set_mutation(), %{
                 "savedComparisonSetId" => relay_id("SavedComparisonSet", saved_set.entropy_id)
               })

      assert Repo.get(SavedComparisonSet, saved_set.id)
    end
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp my_saved_comparison_sets_query do
    """
    query MySavedComparisonSets($first: Int) {
      mySavedComparisonSets(first: $first) {
        edges {
          node {
            id
            name
            items {
              position
              product {
                id
                slug
                name
              }
            }
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
    """
  end

  defp create_saved_comparison_set_mutation do
    """
    mutation CreateSavedComparisonSet($input: CreateSavedComparisonSetInput!) {
      createSavedComparisonSet(input: $input) {
        savedComparisonSet {
          id
          name
          items {
            position
            product {
              id
              slug
              name
            }
          }
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp delete_saved_comparison_set_mutation do
    """
    mutation DeleteSavedComparisonSet($savedComparisonSetId: ID!) {
      deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {
        savedComparisonSet {
          id
          name
        }
        errors {
          code
          message
          field
        }
      }
    }
    """
  end

  defp relay_id(type, local_id), do: Base.encode64("#{type}:#{local_id}")
end
