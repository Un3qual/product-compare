defmodule ProductCompare.CommerceAttribution.ClickLedger do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Revenue.Filters
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @spec query(map() | keyword()) :: Ecto.Query.t()
  def query(opts \\ %{}) do
    filters = Filters.normalize(opts)

    CommerceClickSession
    |> from(as: :session)
    |> join(:inner, [session: session], link in assoc(session, :commerce_link), as: :link)
    |> join(:left, [session: session], merchant_product in MerchantProduct,
      as: :session_merchant_product,
      on: merchant_product.id == session.merchant_product_id
    )
    |> join(:left, [link: link], program in AffiliateProgram,
      as: :link_program,
      on: program.id == link.affiliate_program_id
    )
    |> maybe_join_conversions(filters)
    |> maybe_join_conversion_merchant_product(filters)
    |> maybe_where_merchant(filters.merchant_id)
    |> maybe_where_product(filters.product_id)
    |> maybe_where_network(filters.affiliate_network_id)
    |> maybe_where_currency(filters.currency)
    |> maybe_where_from(filters.from)
    |> maybe_where_to(filters.to)
    |> distinct(true)
    |> order_by([session: session], desc: session.inserted_at, desc: session.id)
    |> preload_click_page()
  end

  defp maybe_join_conversions(query, filters) do
    if Enum.all?([filters.product_id, filters.affiliate_network_id, filters.currency], &is_nil/1) do
      query
    else
      join(query, :left, [session: session], conversion in CommerceConversion,
        as: :conversion,
        on: conversion.click_session_id == session.id
      )
    end
  end

  defp maybe_join_conversion_merchant_product(query, %{product_id: nil}), do: query

  defp maybe_join_conversion_merchant_product(query, _filters) do
    join(query, :left, [conversion: conversion], merchant_product in MerchantProduct,
      as: :conversion_merchant_product,
      on: merchant_product.id == conversion.merchant_product_id
    )
  end

  defp maybe_where_merchant(query, nil), do: query

  defp maybe_where_merchant(query, merchant_id),
    do: where(query, [link: link], link.merchant_id == ^merchant_id)

  defp maybe_where_product(query, nil), do: query

  defp maybe_where_product(query, product_id) do
    where(
      query,
      [
        conversion: conversion,
        conversion_merchant_product: conversion_merchant_product,
        session_merchant_product: session_merchant_product
      ],
      session_merchant_product.product_id == ^product_id or conversion.product_id == ^product_id or
        conversion_merchant_product.product_id == ^product_id
    )
  end

  defp maybe_where_network(query, nil), do: query

  defp maybe_where_network(query, affiliate_network_id) do
    where(
      query,
      [link_program: link_program, conversion: conversion],
      link_program.affiliate_network_id == ^affiliate_network_id or
        conversion.affiliate_network_id == ^affiliate_network_id
    )
  end

  defp maybe_where_currency(query, nil), do: query

  defp maybe_where_currency(query, currency),
    do: where(query, [conversion: conversion], conversion.currency == ^currency)

  defp maybe_where_from(query, nil), do: query

  defp maybe_where_from(query, from_date) do
    from_datetime = Filters.start_datetime(from_date)
    where(query, [session: session], session.inserted_at >= ^from_datetime)
  end

  defp maybe_where_to(query, nil), do: query

  defp maybe_where_to(query, to_date) do
    to_datetime = Filters.exclusive_end_datetime(to_date)
    where(query, [session: session], session.inserted_at < ^to_datetime)
  end

  defp preload_click_page(query) do
    conversions_query =
      from conversion in CommerceConversion,
        order_by: [desc: conversion.reported_at, desc: conversion.id]

    preload(query, [
      :user,
      conversions: ^conversions_query,
      commerce_link: [:merchant, affiliate_program: :affiliate_network],
      merchant_product: [:merchant, :product]
    ])
  end
end
