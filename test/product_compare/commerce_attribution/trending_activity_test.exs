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

  test "deduplicates tagged identities, excludes identity-less clicks, uses inclusive seven days, and orders equal ties by product id" do
    first = offer_product("activity-first")
    second = offer_product("activity-second")
    user = AccountsFixtures.user_fixture()

    Enum.each(1..3, fn index -> click(first, %{anonymous_id: "anon-#{index}"}) end)
    click(first, %{user_id: user.id})
    click(first, %{anonymous_id: Integer.to_string(user.id)})
    click(first, %{user_id: user.id})
    click(first, %{anonymous_id: "anon-1"})
    click(first, %{})
    Enum.each(1..5, fn index -> click(second, %{anonymous_id: "second-#{index}"}) end)
    click(second, %{anonymous_id: "second-5"}, -604_800)
    click(second, %{anonymous_id: "stale"}, -604_801)

    assert CommerceAttribution.trending_product_ids(now: @now) == [
             first.product.id,
             second.product.id
           ]
  end

  test "does not add per-row select work as activity grows" do
    offer = offer_product("activity-budget")
    Enum.each(1..5, fn index -> click(offer, %{anonymous_id: "budget-#{index}"}) end)

    {_five, five_queries} =
      capture_select_queries(fn -> CommerceAttribution.trending_product_ids(now: @now) end)

    Enum.each(6..20, fn index -> click(offer, %{anonymous_id: "budget-#{index}"}) end)

    {_twenty, twenty_queries} =
      capture_select_queries(fn -> CommerceAttribution.trending_product_ids(now: @now) end)

    assert count_select_queries_targeting_table(five_queries, :commerce_click_sessions) ==
             count_select_queries_targeting_table(twenty_queries, :commerce_click_sessions)

    assert count_select_queries_targeting_table(five_queries, :merchant_products) ==
             count_select_queries_targeting_table(twenty_queries, :merchant_products)
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
end
