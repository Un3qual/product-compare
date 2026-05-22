defmodule ProductCompare.CommerceAttribution do
  @moduledoc """
  Attribution context for commerce redirects, click sessions, conversions, and price-paid facts.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @revenue_statuses [:approved, :paid]
  @dashboard_metric_keys [
    "average_paid_price",
    "clicks",
    "commission_revenue",
    "conversions",
    "gross_order_value"
  ]

  @commerce_link_upsert_fields [
    :network,
    :campaign_params,
    :backfilled_from_affiliate_links,
    :is_active
  ]
  @commerce_conversion_upsert_fields [
    :click_session_id,
    :public_click_id,
    :network_click_ref,
    :merchant_id,
    :affiliate_program_id,
    :product_id,
    :merchant_product_id,
    :status,
    :currency,
    :order_amount,
    :commission_amount,
    :commission_rate,
    :attribution_confidence,
    :data_freshness_at,
    :purchased_at,
    :reported_at,
    :raw_payload
  ]
  @commerce_link_conflict_target {:unsafe_fragment,
                                  "(destination_url, COALESCE(affiliate_program_id, 0), merchant_id, link_type)"}

  @spec upsert_commerce_link(map()) :: {:ok, CommerceLink.t()} | {:error, Ecto.Changeset.t()}
  def upsert_commerce_link(attrs) do
    now = DateTime.utc_now()
    changeset = CommerceLink.changeset(%CommerceLink{}, attrs)

    update_fields =
      present_upsert_fields(attrs, changeset, @commerce_link_upsert_fields)

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: @commerce_link_conflict_target,
      returning: true
    )
  end

  @spec create_click_session(map()) ::
          {:ok, CommerceClickSession.t()} | {:error, Ecto.Changeset.t()}
  def create_click_session(attrs) do
    %CommerceClickSession{}
    |> CommerceClickSession.changeset(attrs)
    |> Repo.insert()
  end

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id),
         destination_url when is_binary(destination_url) <-
           lookup_redirect_destination(cast_click_id),
         true <- CommerceLink.valid_destination_url?(destination_url) do
      {:ok, destination_url}
    else
      _not_found -> {:error, :not_found}
    end
  end

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs) do
    now = DateTime.utc_now()

    attrs =
      attrs
      |> maybe_put_click_session_id()
      |> put_default_attribution_confidence()

    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    update_fields =
      present_upsert_fields(attrs, changeset, @commerce_conversion_upsert_fields)

    changeset
    |> Repo.insert(
      on_conflict: conversion_conflict_query(update_fields, now),
      conflict_target: [:source_network, :network_conversion_ref],
      allow_stale: true,
      returning: true
    )
    |> maybe_fetch_unchanged_conversion(changeset)
  end

  @spec create_purchase_price_fact(map()) ::
          {:ok, PurchasePriceFact.t()} | {:error, Ecto.Changeset.t()}
  def create_purchase_price_fact(attrs) do
    %PurchasePriceFact{}
    |> PurchasePriceFact.changeset(attrs)
    |> Repo.insert()
  end

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

  defp lookup_redirect_destination(click_id) do
    Repo.one(
      from session in CommerceClickSession,
        join: link in assoc(session, :commerce_link),
        where: session.click_id == ^click_id and link.is_active == true,
        select: link.destination_url,
        limit: 1
    )
  end

  defp aggregate_revenue_metrics(filters) do
    metrics =
      CommerceConversion
      |> from(as: :conversion)
      |> join(:left, [conversion: conversion], fact in PurchasePriceFact,
        as: :price_fact,
        on: fact.conversion_id == conversion.id
      )
      |> join(:left, [conversion: conversion], merchant_product in MerchantProduct,
        as: :merchant_product,
        on: merchant_product.id == conversion.merchant_product_id
      )
      |> where([conversion: conversion], conversion.status in ^@revenue_statuses)
      |> maybe_where_conversion_merchant(filters.merchant_id)
      |> maybe_where_conversion_product(filters.product_id)
      |> maybe_where_conversion_network(filters.network)
      |> maybe_where_conversion_from(filters.from)
      |> maybe_where_conversion_to(filters.to)
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
      "gross_order_value" => money_string(metrics.gross_order_value)
    }
  end

  defp aggregate_click_count(filters) do
    CommerceClickSession
    |> from(as: :session)
    |> join(:inner, [session: session], link in assoc(session, :commerce_link), as: :link)
    |> maybe_join_converted_product_clicks(filters.product_id)
    |> maybe_where_click_merchant(filters.merchant_id)
    |> maybe_where_click_network(filters.network)
    |> maybe_where_click_from(filters.from)
    |> maybe_where_click_to(filters.to)
    |> select([session: session], count(session.id, :distinct))
    |> Repo.one()
  end

  defp maybe_join_converted_product_clicks(query, nil), do: query

  defp maybe_join_converted_product_clicks(query, product_id) do
    query
    |> join(:inner, [session: session], conversion in CommerceConversion,
      as: :conversion,
      on: conversion.click_session_id == session.id and conversion.status in ^@revenue_statuses
    )
    |> join(:left, [conversion: conversion], merchant_product in MerchantProduct,
      as: :merchant_product,
      on: merchant_product.id == conversion.merchant_product_id
    )
    |> where(
      [conversion: conversion, merchant_product: merchant_product],
      conversion.product_id == ^product_id or merchant_product.product_id == ^product_id
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

  defp maybe_where_conversion_from(query, nil), do: query

  defp maybe_where_conversion_from(query, from_date) do
    where(
      query,
      [conversion: conversion],
      fragment("COALESCE(?, ?)::date", conversion.purchased_at, conversion.reported_at) >=
        ^from_date
    )
  end

  defp maybe_where_conversion_to(query, nil), do: query

  defp maybe_where_conversion_to(query, to_date) do
    where(
      query,
      [conversion: conversion],
      fragment("COALESCE(?, ?)::date", conversion.purchased_at, conversion.reported_at) <=
        ^to_date
    )
  end

  defp maybe_where_click_merchant(query, nil), do: query

  defp maybe_where_click_merchant(query, merchant_id),
    do: where(query, [link: link], link.merchant_id == ^merchant_id)

  defp maybe_where_click_network(query, nil), do: query

  defp maybe_where_click_network(query, network),
    do: where(query, [link: link], link.network == ^network)

  defp maybe_where_click_from(query, nil), do: query

  defp maybe_where_click_from(query, from_date),
    do: where(query, [session: session], fragment("?::date", session.inserted_at) >= ^from_date)

  defp maybe_where_click_to(query, nil), do: query

  defp maybe_where_click_to(query, to_date),
    do: where(query, [session: session], fragment("?::date", session.inserted_at) <= ^to_date)

  defp maybe_suppress_metrics(metrics, min_conversions) when min_conversions > 0 do
    if metrics["conversions"] < min_conversions do
      {Map.new(@dashboard_metric_keys, &{&1, nil}), true}
    else
      {metrics, false}
    end
  end

  defp maybe_suppress_metrics(metrics, _min_conversions), do: {metrics, false}

  defp dashboard_filters(filters) do
    %{
      "from" => date_string(filters.from),
      "merchant_id" => filters.merchant_id,
      "network" => network_string(filters.network),
      "product_id" => filters.product_id,
      "to" => date_string(filters.to)
    }
  end

  defp normalize_revenue_filters(opts) do
    %{
      from: normalize_date(get_revenue_filter(opts, :from)),
      merchant_id: get_revenue_filter(opts, :merchant_id),
      min_conversions: normalize_min_conversions(get_revenue_filter(opts, :min_conversions)),
      network: normalize_network(get_revenue_filter(opts, :network)),
      product_id: get_revenue_filter(opts, :product_id),
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
  defp normalize_date(%DateTime{} = datetime), do: DateTime.to_date(datetime)

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

  defp normalize_network(nil), do: nil

  defp normalize_network(network)
       when network in [:impact, :awin, :rakuten, :cj, :amazon_associates],
       do: network

  defp normalize_network(network) when is_binary(network) do
    network =
      Enum.find(CommerceLink.networks(), fn supported_network ->
        Atom.to_string(supported_network) == network
      end)

    network || raise ArgumentError, "invalid revenue summary network"
  end

  defp normalize_network(_network), do: raise(ArgumentError, "invalid revenue summary network")

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

  defp conversion_conflict_query(update_fields, now) do
    from conversion in CommerceConversion,
      where: fragment("EXCLUDED.reported_at >= ?", conversion.reported_at),
      update: [set: ^(update_fields ++ [updated_at: now])]
  end

  defp maybe_fetch_unchanged_conversion({:ok, %CommerceConversion{id: nil}}, changeset) do
    {:ok, get_existing_conversion!(changeset)}
  end

  defp maybe_fetch_unchanged_conversion(result, _changeset), do: result

  defp get_existing_conversion!(changeset) do
    Repo.get_by!(
      CommerceConversion,
      source_network: Ecto.Changeset.get_field(changeset, :source_network),
      network_conversion_ref: Ecto.Changeset.get_field(changeset, :network_conversion_ref)
    )
  end

  defp maybe_put_click_session_id(attrs) do
    if attr_present?(attrs, :click_session_id) do
      attrs
    else
      case get_attr(attrs, :public_click_id) do
        nil ->
          attrs

        click_id ->
          case get_click_session_by_public_id(click_id) do
            nil -> attrs
            %CommerceClickSession{id: id} -> put_attr(attrs, :click_session_id, id)
          end
      end
    end
  end

  defp get_click_session_by_public_id(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id) do
      Repo.get_by(CommerceClickSession, click_id: cast_click_id)
    else
      :error -> nil
    end
  end

  defp put_default_attribution_confidence(attrs) do
    cond do
      attr_key_present?(attrs, :attribution_confidence) ->
        attrs

      attr_present?(attrs, :click_session_id) ->
        put_attr(attrs, :attribution_confidence, :high)

      true ->
        attrs
    end
  end

  defp get_attr(attrs, key) when is_map(attrs),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))

  defp put_attr(attrs, key, value) when is_map(attrs), do: Map.put(attrs, key, value)

  defp attr_present?(attrs, key), do: not is_nil(get_attr(attrs, key))

  defp present_upsert_fields(attrs, changeset, fields) do
    for field <- fields,
        attr_key_present?(attrs, field),
        do: {field, Ecto.Changeset.get_field(changeset, field)}
  end

  defp attr_key_present?(attrs, key) when is_map(attrs),
    do: Map.has_key?(attrs, key) or Map.has_key?(attrs, Atom.to_string(key))
end
