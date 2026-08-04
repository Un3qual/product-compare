defmodule ProductCompareWeb.CommerceRedirectControllerTest do
  use ProductCompareWeb.ConnCase, async: true

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession

  describe "GET /r/:click_id" do
    test "does not load the signed-in user on an existing click redirect", %{conn: conn} do
      user = AccountsFixtures.user_fixture()
      commerce_link = commerce_link_fixture()
      click_session = click_session_fixture(commerce_link)
      signed_in_conn = log_in_user(conn, user)

      {conn, queries} =
        capture_select_queries(fn ->
          get(signed_in_conn, "/r/#{click_session.click_id}")
        end)

      assert redirected_to(conn, 302) == commerce_link.destination_url
      assert count_select_queries_targeting_table(queries, :users) == 0
    end

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

    test "returns 404 instead of redirecting invalid stored destinations", %{conn: conn} do
      for destination_url <- ["javascript:alert(1)", "https://a\u{200D}b.example/offer"] do
        commerce_link_id = unsafe_commerce_link_fixture(destination_url)

        {:ok, click_session} =
          CommerceAttribution.create_click_session(%{
            commerce_link_id: commerce_link_id,
            click_id: Ecto.UUID.generate(),
            source_surface: :web
          })

        assert response(get(conn, "/r/#{click_session.click_id}"), 404) == "redirect not found"
      end
    end

    test "redirects tracked merchant product clicks through the first-party path", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})

      {:ok, tracked_click} =
        CommerceAttribution.track_outbound_click(%{merchant_product_id: merchant_product.id})

      conn = get(conn, tracked_click.redirect_path)

      assert redirected_to(conn, 302) == "https://merchant.example.com/direct"
    end
  end

  describe "GET /r/merchant-product" do
    test "records and redirects merchant product exits from first-party links", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})

      conn =
        conn
        |> put_req_header("referer", "http://www.example.com/offers")
        |> put_req_header("user-agent", "ProductCompareRedirectTest/1.0")
        |> then(&%{&1 | remote_ip: {198, 51, 100, 8}})
        |> get(tracked_merchant_product_path(merchant_product))

      assert redirected_to(conn, 302) == "https://merchant.example.com/direct"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               1

      assert Repo.aggregate(
               CommerceClickSession,
               :count,
               :id
             ) == 1

      assert %CommerceClickSession{
               user_id: nil,
               referrer: "http://www.example.com/offers",
               user_agent: "ProductCompareRedirectTest/1.0",
               ip_address: %Postgrex.INET{address: {198, 51, 100, 8}, netmask: 32}
             } = Repo.one(CommerceClickSession)
    end

    test "preserves the signed-in user for direct fallback navigation", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})
      user = AccountsFixtures.user_fixture()

      conn =
        conn
        |> log_in_user(user)
        |> put_req_header("referer", "http://www.example.com/offers")
        |> put_req_header("user-agent", "ProductCompareRedirectTest/1.0")
        |> then(&%{&1 | remote_ip: {198, 51, 100, 9}})
        |> get(tracked_merchant_product_path(merchant_product))

      assert redirected_to(conn, 302) == "https://merchant.example.com/direct"

      assert %CommerceClickSession{
               user_id: user_id,
               referrer: "http://www.example.com/offers",
               user_agent: "ProductCompareRedirectTest/1.0",
               ip_address: %Postgrex.INET{address: {198, 51, 100, 9}, netmask: 32}
             } = Repo.one(CommerceClickSession)

      assert user_id == user.id
    end

    test "resolves Impact merchant product exits with the generated publisher reference", %{
      conn: conn
    } do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})
      affiliate_network = affiliate_network_fixture(%{name: "Impact"})

      {:ok, _affiliate_program} =
        Affiliate.upsert_program(%{
          affiliate_network_id: affiliate_network.id,
          merchant_id: merchant_product.merchant_id
        })

      {:ok, _affiliate_link} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: affiliate_network.id,
          original_url: merchant_product.url,
          affiliate_url: "https://affiliate.example.com/click/merchant-product?campaign=summer"
        })

      conn =
        conn
        |> put_req_header("referer", "http://www.example.com/offers")
        |> get(tracked_merchant_product_path(merchant_product))

      assert redirect_url = redirected_to(conn, 302)

      assert String.starts_with?(
               redirect_url,
               "https://affiliate.example.com/click/merchant-product?"
             )

      assert String.contains?(redirect_url, "campaign=summer")

      assert %{"subId1" => click_id} =
               redirect_url
               |> URI.parse()
               |> Map.fetch!(:query)
               |> URI.decode_query()

      assert Repo.get_by(ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
               click_id: click_id
             )
    end

    test "records and redirects copied merchant product exits without request origin", %{
      conn: conn
    } do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})

      conn = get(conn, tracked_merchant_product_path(merchant_product))

      assert redirected_to(conn, 302) == "https://merchant.example.com/direct"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               1

      assert Repo.aggregate(
               CommerceClickSession,
               :count,
               :id
             ) == 1

      assert %CommerceClickSession{user_id: nil} = Repo.one(CommerceClickSession)
    end

    test "keeps a signed-in copied merchant product exit anonymous without a trusted origin", %{
      conn: conn
    } do
      user = AccountsFixtures.user_fixture()
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})

      conn =
        conn
        |> log_in_user(user)
        |> get(tracked_merchant_product_path(merchant_product))

      assert redirected_to(conn, 302) == "https://merchant.example.com/direct"
      assert %CommerceClickSession{user_id: nil} = Repo.one(CommerceClickSession)
    end

    test "returns 404 for merchant product exits from untrusted origins", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "https://merchant.example.com/direct"})

      conn =
        conn
        |> put_req_header("referer", "https://attacker.example/offers")
        |> get(tracked_merchant_product_path(merchant_product))

      assert response(conn, 404) == "redirect not found"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               0

      assert Repo.aggregate(
               ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
               :count,
               :id
             ) == 0
    end

    test "returns 404 for unsafe merchant product destinations", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{url: "http://192.168.1.1/direct"})

      conn =
        conn
        |> put_req_header("referer", "http://www.example.com/offers")
        |> get(tracked_merchant_product_path(merchant_product))

      assert response(conn, 404) == "redirect not found"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               0

      assert Repo.aggregate(
               ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
               :count,
               :id
             ) == 0
    end

    test "returns 404 for invalid merchant product ids", %{conn: conn} do
      conn =
        conn
        |> put_req_header("referer", "http://www.example.com/offers")
        |> get("/r/merchant-product?merchantProductId=not-a-relay-id")

      assert response(conn, 404) == "redirect not found"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               0

      assert Repo.aggregate(
               ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
               :count,
               :id
             ) == 0
    end

    test "returns 404 for inactive merchant product ids", %{conn: conn} do
      merchant_product = merchant_product_fixture(%{is_active: false})

      conn =
        conn
        |> put_req_header("referer", "http://www.example.com/offers")
        |> get(tracked_merchant_product_path(merchant_product))

      assert response(conn, 404) == "redirect not found"

      assert Repo.aggregate(ProductCompareSchemas.CommerceAttribution.CommerceLink, :count, :id) ==
               0

      assert Repo.aggregate(
               ProductCompareSchemas.CommerceAttribution.CommerceClickSession,
               :count,
               :id
             ) == 0
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

  defp commerce_link_fixture(attrs \\ %{}) do
    merchant = merchant_fixture()
    suffix = System.unique_integer([:positive])

    {:ok, commerce_link} =
      attrs
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:destination_url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:link_type, :non_affiliate)
      |> Map.put_new(:network, nil)
      |> CommerceAttribution.upsert_commerce_link()

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

  defp merchant_product_fixture(attrs) do
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    suffix = System.unique_integer([:positive])

    product =
      Map.get_lazy(attrs, :product, fn ->
        ProductCompare.Fixtures.SpecsFixtures.product_fixture()
      end)

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

  defp affiliate_network_fixture(attrs) do
    suffix = System.unique_integer([:positive])

    {:ok, affiliate_network} =
      attrs
      |> Map.put_new(:name, "Affiliate Network #{suffix}")
      |> Affiliate.upsert_network()

    affiliate_network
  end

  defp tracked_merchant_product_path(merchant_product) do
    "/r/merchant-product?merchantProductId=#{URI.encode_www_form(relay_id(:merchant_product, merchant_product.id))}"
  end

  defp unsafe_commerce_link_fixture(destination_url) do
    merchant = merchant_fixture()
    now = DateTime.utc_now()

    {1, [%{id: commerce_link_id}]} =
      Repo.insert_all(
        "commerce_links",
        [
          %{
            merchant_id: merchant.id,
            destination_url: destination_url,
            link_type: "non_affiliate",
            inserted_at: now,
            updated_at: now
          }
        ],
        returning: [:id]
      )

    commerce_link_id
  end
end
