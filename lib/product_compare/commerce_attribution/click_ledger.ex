defmodule ProductCompare.CommerceAttribution.ClickLedger do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Revenue.{Aggregation, Filters}
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession

  @spec query(map() | keyword()) :: Ecto.Query.t()
  def query(opts \\ %{}) do
    filters = Filters.normalize(opts)

    CommerceClickSession
    |> from(as: :session)
    |> where([session: session], session.id in subquery(matching_session_ids(filters)))
    |> order_by([session: session], desc: session.inserted_at, desc: session.id)
    |> preload_click_page(filters)
  end

  defp matching_session_ids(filters) do
    click_session_ids =
      filters
      |> Aggregation.click_sessions_query()
      |> select([session: session], session.id)

    if conversion_union_required?(filters) do
      conversion_session_ids =
        filters
        |> Aggregation.conversion_evidence_query()
        |> where([conversion: conversion], not is_nil(conversion.click_session_id))
        |> select([conversion: conversion], conversion.click_session_id)

      union(click_session_ids, ^conversion_session_ids)
    else
      click_session_ids
    end
  end

  defp conversion_union_required?(filters) do
    Enum.any?(
      [
        filters.merchant_id,
        filters.product_id,
        filters.affiliate_network_id,
        filters.from,
        filters.to
      ],
      &(not is_nil(&1))
    )
  end

  defp preload_click_page(query, filters) do
    conversions_query = conversion_preload_query(filters)

    preload(query, [
      :user,
      conversions: ^conversions_query,
      commerce_link: [:merchant, affiliate_program: :affiliate_network],
      merchant_product: [:merchant, :product]
    ])
  end

  defp conversion_preload_query(filters) do
    filters
    |> Aggregation.conversion_evidence_query()
    |> join(:left, [conversion: conversion], network in assoc(conversion, :affiliate_network),
      as: :conversion_network
    )
    |> join(:left, [conversion: conversion], merchant in assoc(conversion, :merchant),
      as: :conversion_merchant
    )
    |> join(:left, [conversion: conversion], product in assoc(conversion, :product),
      as: :conversion_product
    )
    |> join(
      :left,
      [merchant_product: merchant_product],
      merchant in assoc(merchant_product, :merchant),
      as: :conversion_merchant_product_merchant
    )
    |> join(
      :left,
      [merchant_product: merchant_product],
      product in assoc(merchant_product, :product),
      as: :conversion_merchant_product_product
    )
    |> order_by([conversion: conversion], desc: conversion.reported_at, desc: conversion.id)
    |> preload(
      [
        merchant_product: merchant_product,
        conversion_network: network,
        conversion_merchant: merchant,
        conversion_product: product,
        conversion_merchant_product_merchant: merchant_product_merchant,
        conversion_merchant_product_product: merchant_product_product
      ],
      affiliate_network: network,
      merchant: merchant,
      product: product,
      merchant_product:
        {merchant_product, merchant: merchant_product_merchant, product: merchant_product_product}
    )
  end
end
