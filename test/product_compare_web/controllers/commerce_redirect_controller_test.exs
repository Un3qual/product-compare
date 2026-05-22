defmodule ProductCompareWeb.CommerceRedirectControllerTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Pricing

  describe "GET /r/:click_id" do
    test "redirects known click ids to the commerce link destination", %{conn: conn} do
      commerce_link = commerce_link_fixture()
      click_session = click_session_fixture(commerce_link)

      conn = get(conn, "/r/#{click_session.click_id}")

      assert redirected_to(conn, 302) == commerce_link.destination_url
    end

    test "returns 404 for unknown click ids", %{conn: conn} do
      conn = get(conn, "/r/#{Ecto.UUID.generate()}")

      assert response(conn, 404) == "redirect not found"
    end
  end

  defp click_session_fixture(commerce_link) do
    {:ok, click_session} =
      CommerceAttribution.create_click_session(%{
        commerce_link_id: commerce_link.id,
        click_id: Ecto.UUID.generate(),
        anonymous_id: "anon-#{System.unique_integer([:positive])}",
        source_surface: :web
      })

    click_session
  end

  defp commerce_link_fixture do
    merchant = merchant_fixture()
    suffix = System.unique_integer([:positive])

    {:ok, commerce_link} =
      CommerceAttribution.upsert_commerce_link(%{
        merchant_id: merchant.id,
        destination_url: "https://merchant.example.com/products/#{suffix}",
        link_type: :affiliate,
        network: :impact
      })

    commerce_link
  end

  defp merchant_fixture do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Merchant #{suffix}",
        domain: "merchant-#{suffix}.example.com"
      })

    merchant
  end
end
