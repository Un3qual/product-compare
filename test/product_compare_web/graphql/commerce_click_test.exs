defmodule ProductCompareWeb.GraphQL.CommerceClickTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink

  describe "/api/graphql commerce click tracking" do
    test "creates a tracked commerce click from only a merchant product ID", %{conn: conn} do
      merchant_product =
        merchant_product_fixture(%{url: "https://merchant.example.com/direct-product"})

      response =
        graphql(conn, track_commerce_click_mutation(), %{
          "input" => %{
            "merchantProductId" => relay_id(:merchant_product, merchant_product.id)
          }
        })

      assert %{
               "data" => %{
                 "trackCommerceClick" => %{
                   "redirectPath" => redirect_path,
                   "errors" => []
                 }
               }
             } = response

      assert String.starts_with?(redirect_path, "/r/")

      click_id = String.replace_prefix(redirect_path, "/r/", "")

      assert {:ok, "https://merchant.example.com/direct-product"} =
               CommerceAttribution.redirect_destination(click_id)

      assert Repo.aggregate(CommerceLink, :count, :id) == 1
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 1
    end

    test "rejects raw browser-provided destinations", %{conn: conn} do
      merchant_product = merchant_product_fixture()

      response =
        graphql(conn, track_commerce_click_mutation(), %{
          "input" => %{
            "merchantProductId" => relay_id(:merchant_product, merchant_product.id),
            "destinationUrl" => "https://attacker.example/redirect"
          }
        })

      assert %{
               "errors" => [
                 %{"message" => message}
                 | _
               ]
             } = response

      assert message =~ ~s("destinationUrl")
      assert message =~ "Unknown field"
      assert Repo.aggregate(CommerceLink, :count, :id) == 0
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end

    test "returns typed payload errors for invalid merchant product IDs", %{conn: conn} do
      response =
        graphql(conn, track_commerce_click_mutation(), %{
          "input" => %{
            "merchantProductId" => relay_id(:product, 123)
          }
        })

      assert %{
               "data" => %{
                 "trackCommerceClick" => %{
                   "redirectPath" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "field" => "merchantProductId",
                       "message" => "invalid merchant product id"
                     }
                   ]
                 }
               }
             } = response

      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end
  end

  defp track_commerce_click_mutation do
    """
    mutation TrackCommerceClick($input: TrackCommerceClickInput!) {
      trackCommerceClick(input: $input) {
        redirectPath
        errors {
          code
          field
          message
        }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
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

  defp merchant_product_fixture(attrs \\ %{}) do
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
end
