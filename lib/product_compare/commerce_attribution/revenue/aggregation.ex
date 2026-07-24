defmodule ProductCompare.CommerceAttribution.Revenue.Aggregation do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Revenue.Filters
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @revenue_statuses [:approved, :paid]

  @spec metrics(map()) :: map()
  def metrics(filters) do
    query = revenue_metrics_query(filters)
    currency = revenue_metrics_currency!(query, filters.currency)

    query
    |> select([conversion: conversion, price_fact: fact], %{
      conversions: count(conversion.id),
      gross_order_value: sum(conversion.order_amount),
      commission_revenue: sum(conversion.commission_amount),
      average_paid_price: avg(fact.reported_paid_price)
    })
    |> Repo.one()
    |> Map.put(:currency, currency)
  end

  @spec click_count(map()) :: non_neg_integer()
  def click_count(filters) do
    CommerceClickSession
    |> from(as: :session)
    |> join(:inner, [session: session], link in assoc(session, :commerce_link), as: :link)
    |> maybe_join_click_conversions(filters)
    |> maybe_join_click_session_merchant_product(filters)
    |> maybe_join_click_conversion_merchant_product(filters)
    |> maybe_where_click_merchant(filters.merchant_id)
    |> maybe_where_click_product(filters.product_id)
    |> maybe_where_click_network(filters.network)
    |> maybe_where_click_from(filters.from)
    |> maybe_where_click_to(filters.to)
    |> select([session: session], count(session.id, :distinct))
    |> Repo.one()
  end

  defp revenue_metrics_query(filters) do
    CommerceConversion
    |> from(as: :conversion)
    |> join(:left, [conversion: conversion], fact in PurchasePriceFact,
      as: :price_fact,
      on: fact.conversion_id == conversion.id and fact.currency == conversion.currency
    )
    |> join(:left, [conversion: conversion], merchant_product in MerchantProduct,
      as: :merchant_product,
      on: merchant_product.id == conversion.merchant_product_id
    )
    |> where([conversion: conversion], conversion.status in ^@revenue_statuses)
    |> maybe_where_conversion_merchant(filters.merchant_id)
    |> maybe_where_conversion_product(filters.product_id)
    |> maybe_where_conversion_network(filters.network)
    |> maybe_where_conversion_currency(filters.currency)
    |> maybe_where_conversion_from(filters.from)
    |> maybe_where_conversion_to(filters.to)
  end

  defp revenue_metrics_currency!(_query, currency) when is_binary(currency), do: currency

  defp revenue_metrics_currency!(query, nil) do
    currencies =
      query
      |> distinct(true)
      |> select([conversion: conversion], conversion.currency)
      |> limit(2)
      |> Repo.all()

    case currencies do
      [] -> nil
      [currency] -> currency
      [_first_currency, _second_currency | _rest] -> raise_mixed_currency_error!()
    end
  end

  defp raise_mixed_currency_error! do
    raise ArgumentError, "revenue summary currency filter is required for mixed currencies"
  end

  defp maybe_join_click_conversions(query, %{network: nil, product_id: nil}), do: query

  defp maybe_join_click_conversions(query, _filters) do
    join(query, :left, [session: session], conversion in CommerceConversion,
      as: :conversion,
      on: conversion.click_session_id == session.id
    )
  end

  defp maybe_join_click_session_merchant_product(query, %{product_id: nil}), do: query

  defp maybe_join_click_session_merchant_product(query, _filters) do
    join(query, :left, [session: session], merchant_product in MerchantProduct,
      as: :session_merchant_product,
      on: merchant_product.id == session.merchant_product_id
    )
  end

  defp maybe_join_click_conversion_merchant_product(query, %{product_id: nil}), do: query

  defp maybe_join_click_conversion_merchant_product(query, _filters) do
    join(query, :left, [conversion: conversion], merchant_product in MerchantProduct,
      as: :conversion_merchant_product,
      on: merchant_product.id == conversion.merchant_product_id
    )
  end

  defp maybe_where_conversion_merchant(query, nil), do: query

  defp maybe_where_conversion_merchant(query, merchant_id) do
    where(
      query,
      [conversion: conversion, merchant_product: merchant_product],
      conversion.merchant_id == ^merchant_id or merchant_product.merchant_id == ^merchant_id
    )
  end

  defp maybe_where_conversion_product(query, nil), do: query

  defp maybe_where_conversion_product(query, product_id) do
    where(
      query,
      [conversion: conversion, merchant_product: merchant_product],
      conversion.product_id == ^product_id or merchant_product.product_id == ^product_id
    )
  end

  defp maybe_where_conversion_network(query, nil), do: query

  defp maybe_where_conversion_network(query, network),
    do: where(query, [conversion: conversion], conversion.source_network == ^network)

  defp maybe_where_conversion_currency(query, nil), do: query

  defp maybe_where_conversion_currency(query, currency),
    do: where(query, [conversion: conversion], conversion.currency == ^currency)

  defp maybe_where_conversion_from(query, nil), do: query

  defp maybe_where_conversion_from(query, from_date) do
    from_datetime = Filters.start_datetime(from_date)

    where(
      query,
      [conversion: conversion],
      (not is_nil(conversion.purchased_at) and conversion.purchased_at >= ^from_datetime) or
        (is_nil(conversion.purchased_at) and conversion.reported_at >= ^from_datetime)
    )
  end

  defp maybe_where_conversion_to(query, nil), do: query

  defp maybe_where_conversion_to(query, to_date) do
    to_datetime = Filters.exclusive_end_datetime(to_date)

    where(
      query,
      [conversion: conversion],
      (not is_nil(conversion.purchased_at) and conversion.purchased_at < ^to_datetime) or
        (is_nil(conversion.purchased_at) and conversion.reported_at < ^to_datetime)
    )
  end

  defp maybe_where_click_merchant(query, nil), do: query

  defp maybe_where_click_merchant(query, merchant_id),
    do: where(query, [link: link], link.merchant_id == ^merchant_id)

  defp maybe_where_click_product(query, nil), do: query

  defp maybe_where_click_product(query, product_id) do
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

  defp maybe_where_click_network(query, nil), do: query

  defp maybe_where_click_network(query, network) do
    where(
      query,
      [link: link, conversion: conversion],
      link.network == ^network or (is_nil(link.network) and conversion.source_network == ^network)
    )
  end

  defp maybe_where_click_from(query, nil), do: query

  defp maybe_where_click_from(query, from_date) do
    from_datetime = Filters.start_datetime(from_date)
    where(query, [session: session], session.inserted_at >= ^from_datetime)
  end

  defp maybe_where_click_to(query, nil), do: query

  defp maybe_where_click_to(query, to_date) do
    to_datetime = Filters.exclusive_end_datetime(to_date)
    where(query, [session: session], session.inserted_at < ^to_datetime)
  end
end
