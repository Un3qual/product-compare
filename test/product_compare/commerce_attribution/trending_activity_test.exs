defmodule ProductCompare.CommerceAttribution.TrendingActivityTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession

  @now ~U[2026-08-10 12:00:00Z]

  test "enforces distinct five-identity thresholds and discriminates inclusive and exclusive seven-day boundaries" do
    first = offer_product("activity-first")
    second = offer_product("activity-second")
    inclusive_boundary = offer_product("activity-inclusive-boundary")
    exclusive_boundary = offer_product("activity-exclusive-boundary")
    four_unique = offer_product("activity-four-unique")
    five_unique = offer_product("activity-five-unique")
    user = AccountsFixtures.user_fixture()

    Enum.each(1..3, fn index -> click(first, anonymous_actor("anon-#{index}")) end)
    click(first, %{user_id: user.id})
    click(first, anonymous_actor("same-digits-as-user-#{user.id}"))
    click(first, %{user_id: user.id})
    click(first, anonymous_actor("anon-1"))
    click(first, %{})
    Enum.each(1..5, fn index -> click(second, anonymous_actor("second-#{index}")) end)

    Enum.each(1..4, fn index ->
      click(inclusive_boundary, anonymous_actor("inclusive-#{index}"))
      click(exclusive_boundary, anonymous_actor("exclusive-#{index}"))
      click(four_unique, anonymous_actor("four-#{index}"))
    end)

    click(inclusive_boundary, anonymous_actor("inclusive-5"), -604_800)
    click(exclusive_boundary, anonymous_actor("exclusive-5"), -604_801)
    Enum.each(1..8, fn _ -> click(four_unique, anonymous_actor("four-1")) end)
    Enum.each(1..5, fn index -> click(five_unique, anonymous_actor("five-#{index}")) end)

    assert trending_product_ids(now: @now) == [
             first.product.id,
             second.product.id,
             inclusive_boundary.product.id,
             five_unique.product.id
           ]
  end

  test "does not add per-row select work as activity grows" do
    offer = offer_product("activity-budget")
    Enum.each(1..5, fn index -> click(offer, anonymous_actor("budget-#{index}")) end)

    {_five, five_queries} =
      capture_select_queries(fn -> trending_product_ids(now: @now) end)

    Enum.each(6..20, fn index -> click(offer, anonymous_actor("budget-#{index}")) end)

    {_twenty, twenty_queries} =
      capture_select_queries(fn -> trending_product_ids(now: @now) end)

    assert count_select_queries_targeting_table(five_queries, :commerce_click_sessions) ==
             count_select_queries_targeting_table(twenty_queries, :commerce_click_sessions)

    assert count_select_queries_targeting_table(five_queries, :merchant_products) ==
             count_select_queries_targeting_table(twenty_queries, :merchant_products)
  end

  test "returns all qualified candidates in deterministic activity order" do
    products =
      Enum.map(1..8, fn index ->
        product = offer_product("activity-boundary-#{index}")

        Enum.each(1..(12 - index), fn identity ->
          click(product, anonymous_actor("boundary-#{index}-#{identity}"))
        end)

        product
      end)

    assert trending_product_ids(now: @now) ==
             products |> Enum.take(7) |> Enum.map(& &1.product.id)
  end

  test "limits trending deals after intersecting activity with below-median USD eligibility" do
    products =
      Enum.map(1..8, fn index ->
        product = offer_product("trending-intersection-#{index}")

        Enum.each(1..(14 - index), fn identity ->
          click(product, anonymous_actor("intersection-#{index}-#{identity}"))
        end)

        add_price(product.offer, "50", 0)

        if index > 2 do
          add_price(product.offer, "100", -3_600)
        end

        product
      end)

    {candidates, queries} =
      capture_select_queries(fn ->
        [now: @now]
        |> CommerceAttribution.trending_product_candidates_query()
        |> Pricing.home_trending_deal_candidates(now: @now, limit: 100)
      end)

    assert [_, _, _, _, _, _] = candidates

    assert Enum.map(candidates, & &1.product_id) ==
             products |> Enum.drop(2) |> Enum.map(& &1.product.id)

    assert Enum.any?(queries, &String.contains?(&1, "LIMIT"))
  end

  defp offer_product(slug) do
    product = SpecsFixtures.product_fixture(%{slug: slug})

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "#{slug} merchant", domain: "#{slug}.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/offer",
        currency: "USD",
        is_active: true
      })

    {:ok, link} =
      CommerceAttribution.upsert_commerce_link(%{
        merchant_id: merchant.id,
        destination_url: "https://#{slug}.example/click",
        link_type: :non_affiliate,
        is_active: true
      })

    %{product: product, offer: offer, link: link}
  end

  defp click(%{offer: offer, link: link}, attrs, offset \\ 0) do
    params =
      Map.merge(
        %{merchant_product_id: offer.id, commerce_link_id: link.id, source_surface: :web},
        attrs
      )

    {:ok, click} =
      %CommerceClickSession{} |> CommerceClickSession.changeset(params) |> Repo.insert()

    Repo.update_all(
      Ecto.Query.from(session in CommerceClickSession, where: session.id == ^click.id),
      set: [inserted_at: DateTime.add(@now, offset, :second)]
    )
  end

  defp anonymous_actor(key) do
    process_key = {__MODULE__, key}

    visitor_id =
      Process.get(process_key) ||
        then(Ecto.UUID.generate(), fn entropy_id ->
          {:ok, visitor} = CommerceAttribution.get_or_create_anonymous_visitor(entropy_id)
          Process.put(process_key, visitor.id)
          visitor.id
        end)

    %{anonymous_visitor_id: visitor_id}
  end

  defp add_price(offer, price, offset) do
    {:ok, _price_point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.add(@now, offset, :second),
        price: price,
        shipping: "5",
        in_stock: true
      })
  end

  defp trending_product_ids(opts) do
    opts
    |> CommerceAttribution.trending_product_candidates_query()
    |> Repo.all()
    |> Enum.map(& &1.product_id)
  end
end
