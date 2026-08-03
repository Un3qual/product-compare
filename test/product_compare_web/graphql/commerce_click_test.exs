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
        conn
        |> put_req_header_same_origin()
        |> put_req_header("referer", "https://app.example.com/products/desk")
        |> put_req_header("user-agent", "ProductCompareTest/1.0")
        |> then(&%{&1 | remote_ip: {203, 0, 113, 42}})
        |> graphql(track_commerce_click_mutation(), %{
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

      assert %CommerceClickSession{
               merchant_product_id: merchant_product_id,
               referrer: "https://app.example.com/products/desk",
               user_agent: "ProductCompareTest/1.0",
               ip_address: %Postgrex.INET{address: {203, 0, 113, 42}, netmask: 32}
             } =
               Repo.one(CommerceClickSession)

      assert merchant_product_id == merchant_product.id
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
        conn
        |> put_req_header_same_origin()
        |> graphql(track_commerce_click_mutation(), %{
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

    test "rejects untrusted request origins without recording a click", %{conn: conn} do
      merchant_product = merchant_product_fixture()

      response =
        conn
        |> put_req_header("origin", "https://evil.example.com")
        |> graphql(track_commerce_click_mutation(), %{
          "input" => %{
            "merchantProductId" => relay_id(:merchant_product, merchant_product.id)
          }
        })

      assert %{
               "data" => %{
                 "trackCommerceClick" => %{
                   "redirectPath" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ORIGIN",
                       "field" => nil,
                       "message" => "cross-origin request rejected"
                     }
                   ]
                 }
               }
             } = response

      assert Repo.aggregate(CommerceLink, :count, :id) == 0
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end

    test "rejects unsafe merchant product destinations without recording a click", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "http://localhost/direct-product"})

      response =
        conn
        |> put_req_header_same_origin()
        |> graphql(track_commerce_click_mutation(), %{
          "input" => %{
            "merchantProductId" => relay_id(:merchant_product, merchant_product.id)
          }
        })

      assert %{
               "data" => %{
                 "trackCommerceClick" => %{
                   "redirectPath" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ARGUMENT",
                       "field" => "destinationUrl",
                       "message" => "must be a valid http/https URL"
                     }
                   ]
                 }
               }
             } = response

      assert Repo.aggregate(CommerceLink, :count, :id) == 0
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
    merchant = Map.get_lazy(attrs, :merchant, fn -> merchant_fixture() end)
    product = Map.get_lazy(attrs, :product, fn -> SpecsFixtures.product_fixture() end)
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
