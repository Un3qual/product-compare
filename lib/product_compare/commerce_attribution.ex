defmodule ProductCompare.CommerceAttribution do
  @moduledoc """
  Attribution context for commerce redirects, click sessions, conversions, and price-paid facts.
  """

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Clicks
  alias ProductCompare.CommerceAttribution.Conversions
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @revenue_statuses [:approved, :paid]
  @max_bigint_id 9_223_372_036_854_775_807
  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs), do: Clicks.upsert_commerce_link(attrs)

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs), do: Clicks.create_click_session(attrs)

  @spec track_outbound_click(map()) ::
          {:ok,
           %{
             commerce_link: CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound_click(attrs), do: Clicks.track_outbound_click(attrs)

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id), do: Clicks.redirect_destination(click_id)

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs), do: Conversions.ingest_conversion(attrs)

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs), do: Conversions.create_purchase_price_fact(attrs)

  @spec dashboard_revenue_summary(map() | keyword()) :: map()
  def dashboard_revenue_summary(opts \\ %{}) do
    filters = normalize_revenue_filters(opts)

    metrics =
      filters
      |> aggregate_revenue_metrics()
      |> Map.put("clicks", aggregate_click_count(filters))

    {metrics, suppressed?} = maybe_suppress_metrics(metrics, filters.min_conversions)

    %{
      "filters" => dashboard_filters(filters),
      "metrics" => metrics,
      "suppression" => %{
        "suppressed" => suppressed?,
        "threshold" => filters.min_conversions
      }
    }
  end

  @spec merchant_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def merchant_revenue_summary(merchant_id, opts \\ %{}) do
    opts
    |> put_revenue_filter(:merchant_id, merchant_id)
    |> dashboard_revenue_summary()
  end

  @spec product_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def product_revenue_summary(product_id, opts \\ %{}) do
    opts
    |> put_revenue_filter(:product_id, product_id)
    |> dashboard_revenue_summary()
  end

  @spec network_revenue_summary(atom() | String.t(), map() | keyword()) :: map()
  def network_revenue_summary(network, opts \\ %{}) do
    opts
    |> put_revenue_filter(:network, network)
    |> dashboard_revenue_summary()
  end

  defp aggregate_revenue_metrics(filters) do
    query = revenue_metrics_query(filters)
    currency = revenue_metrics_currency!(query, filters.currency)

    metrics =
      query
      |> select([conversion: conversion, price_fact: fact], %{
        conversions: count(conversion.id),
        gross_order_value: sum(conversion.order_amount),
        commission_revenue: sum(conversion.commission_amount),
        average_paid_price: avg(fact.reported_paid_price)
      })
      |> Repo.one()

    %{
      "average_paid_price" => nullable_money_string(metrics.average_paid_price),
      "commission_revenue" => money_string(metrics.commission_revenue),
      "conversions" => metrics.conversions,
      "currency" => currency,
      "gross_order_value" => money_string(metrics.gross_order_value)
    }
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

  defp aggregate_click_count(filters) do
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
    from_datetime = date_start_datetime(from_date)

    where(
      query,
      [conversion: conversion],
      (not is_nil(conversion.purchased_at) and conversion.purchased_at >= ^from_datetime) or
        (is_nil(conversion.purchased_at) and conversion.reported_at >= ^from_datetime)
    )
  end

  defp maybe_where_conversion_to(query, nil), do: query

  defp maybe_where_conversion_to(query, to_date) do
    to_datetime = date_exclusive_end_datetime(to_date)

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

  defp maybe_where_click_from(query, from_date),
    do: where(query, [session: session], session.inserted_at >= ^date_start_datetime(from_date))

  defp maybe_where_click_to(query, nil), do: query

  defp maybe_where_click_to(query, to_date),
    do:
      where(
        query,
        [session: session],
        session.inserted_at < ^date_exclusive_end_datetime(to_date)
      )

  defp maybe_suppress_metrics(metrics, min_conversions) when min_conversions > 0 do
    if metrics["conversions"] < min_conversions do
      {Map.new(Map.keys(metrics), &{&1, nil}), true}
    else
      {metrics, false}
    end
  end

  defp maybe_suppress_metrics(metrics, _min_conversions), do: {metrics, false}

  defp dashboard_filters(filters) do
    %{
      "currency" => filters.currency,
      "from" => date_string(filters.from),
      "merchant_id" => filters.merchant_id,
      "network" => network_string(filters.network),
      "product_id" => filters.product_id,
      "to" => date_string(filters.to)
    }
  end

  defp normalize_revenue_filters(opts) do
    %{
      currency: normalize_currency(get_revenue_filter(opts, :currency)),
      from: normalize_date(get_revenue_filter(opts, :from)),
      merchant_id: normalize_dimension_id(get_revenue_filter(opts, :merchant_id), :merchant_id),
      min_conversions: normalize_min_conversions(get_revenue_filter(opts, :min_conversions)),
      network: normalize_network(get_revenue_filter(opts, :network)),
      product_id: normalize_dimension_id(get_revenue_filter(opts, :product_id), :product_id),
      to: normalize_date(get_revenue_filter(opts, :to))
    }
  end

  defp get_revenue_filter(opts, key) when is_list(opts), do: Keyword.get(opts, key)

  defp get_revenue_filter(opts, key) when is_map(opts),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key)))

  defp get_revenue_filter(_opts, _key), do: nil

  defp put_revenue_filter(opts, key, value) when is_list(opts), do: Keyword.put(opts, key, value)
  defp put_revenue_filter(opts, key, value) when is_map(opts), do: Map.put(opts, key, value)
  defp put_revenue_filter(_opts, key, value), do: %{key => value}

  defp normalize_date(nil), do: nil
  defp normalize_date(%Date{} = date), do: date

  defp normalize_date(%DateTime{} = datetime) do
    datetime
    |> DateTime.shift_zone!("Etc/UTC")
    |> DateTime.to_date()
  end

  defp normalize_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, date} -> date
      {:error, _reason} -> raise ArgumentError, "invalid revenue summary date"
    end
  end

  defp normalize_min_conversions(nil), do: 0
  defp normalize_min_conversions(value) when is_integer(value) and value >= 0, do: value

  defp normalize_min_conversions(value) when is_binary(value) do
    case Integer.parse(value) do
      {integer, ""} when integer >= 0 -> integer
      _invalid -> raise ArgumentError, "invalid revenue summary suppression threshold"
    end
  end

  defp normalize_min_conversions(_value),
    do: raise(ArgumentError, "invalid revenue summary suppression threshold")

  defp normalize_dimension_id(nil, _field), do: nil

  defp normalize_dimension_id(value, _field)
       when is_integer(value) and value > 0 and value <= @max_bigint_id,
       do: value

  defp normalize_dimension_id(value, field) when is_binary(value) do
    case Integer.parse(value) do
      {integer, ""} when integer > 0 and integer <= @max_bigint_id -> integer
      _invalid -> raise_invalid_dimension_id!(field)
    end
  end

  defp normalize_dimension_id(_value, field), do: raise_invalid_dimension_id!(field)

  defp raise_invalid_dimension_id!(field),
    do: raise(ArgumentError, "invalid revenue summary #{field}")

  defp normalize_currency(nil), do: nil

  defp normalize_currency(currency) when is_binary(currency) do
    currency = String.upcase(currency)

    if String.match?(currency, ~r/^[A-Z]{3}$/) do
      currency
    else
      raise ArgumentError, "invalid revenue summary currency"
    end
  end

  defp normalize_currency(_currency), do: raise(ArgumentError, "invalid revenue summary currency")

  defp normalize_network(nil), do: nil

  defp normalize_network(network) when is_atom(network) do
    if network in CommerceLink.networks() do
      network
    else
      raise ArgumentError, "invalid revenue summary network"
    end
  end

  defp normalize_network(network) when is_binary(network) do
    network =
      Enum.find(CommerceLink.networks(), fn supported_network ->
        Atom.to_string(supported_network) == network
      end)

    network || raise ArgumentError, "invalid revenue summary network"
  end

  defp normalize_network(_network), do: raise(ArgumentError, "invalid revenue summary network")

  defp date_start_datetime(%Date{} = date), do: DateTime.new!(date, ~T[00:00:00], "Etc/UTC")

  defp date_exclusive_end_datetime(%Date{} = date) do
    date
    |> Date.add(1)
    |> DateTime.new!(~T[00:00:00], "Etc/UTC")
  end

  defp date_string(nil), do: nil
  defp date_string(%Date{} = date), do: Date.to_iso8601(date)

  defp network_string(nil), do: nil
  defp network_string(network), do: Atom.to_string(network)

  defp money_string(nil), do: "0.00"

  defp money_string(%Decimal{} = decimal) do
    decimal
    |> Decimal.round(2)
    |> Decimal.to_string(:normal)
  end

  defp nullable_money_string(nil), do: nil
  defp nullable_money_string(%Decimal{} = decimal), do: money_string(decimal)
end
