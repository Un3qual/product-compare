defmodule ProductCompare.CommerceAttribution do
  @moduledoc """
  Attribution context for commerce redirects, click sessions, conversions, and price-paid facts.
  """

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @revenue_statuses [:approved, :paid]
  @max_bigint_id 9_223_372_036_854_775_807
  @affiliate_network_names %{
    "amazon" => :amazon_associates,
    "amazon associates" => :amazon_associates,
    "awin" => :awin,
    "cj" => :cj,
    "commission junction" => :cj,
    "impact" => :impact,
    "rakuten" => :rakuten
  }

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
  @click_id_query_keys MapSet.new(~w(ClickId clickId click_id subId subid sub_id))

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

  @spec track_outbound_click(map()) ::
          {:ok,
           %{
             commerce_link: CommerceLink.t(),
             click_session: CommerceClickSession.t(),
             redirect_path: String.t()
           }}
          | {:error, :merchant_product_not_found | Ecto.Changeset.t()}
  def track_outbound_click(attrs) do
    with {:ok, merchant_product_id} <- normalize_merchant_product_id(attrs),
         {:ok, destination} <- trusted_click_destination(merchant_product_id) do
      attrs
      |> Map.put(:merchant_product_id, merchant_product_id)
      |> persist_tracked_click(destination)
      |> unwrap_transaction()
    else
      :error -> {:error, :merchant_product_not_found}
      {:error, _reason} = error -> error
    end
  end

  @spec redirect_destination(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def redirect_destination(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id),
         destination when is_map(destination) <-
           lookup_redirect_destination(cast_click_id),
         destination_url <- redirect_destination_url(destination),
         true <- CommerceLink.valid_destination_url?(destination_url) do
      {:ok, destination_url}
    else
      _not_found -> {:error, :not_found}
    end
  end

  @spec ingest_conversion(map()) ::
          {:ok, CommerceConversion.t()} | {:error, Ecto.Changeset.t()}
  def ingest_conversion(attrs) do
    case resolve_click_attribution(attrs) do
      {:ok, attrs} -> persist_conversion(attrs)
      {:error, conflicts} -> {:error, attribution_conflict_changeset(attrs, conflicts)}
    end
  end

  defp persist_conversion(attrs) do
    now = DateTime.utc_now()

    attrs = put_default_attribution_confidence(attrs)

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
        select: %{
          click_id: session.click_id,
          destination_url: link.destination_url,
          link_type: link.link_type,
          network: link.network
        },
        limit: 1
    )
  end

  defp normalize_merchant_product_id(attrs) do
    attrs
    |> Input.fetch_attr(:merchant_product_id)
    |> Input.normalize_integer_id()
  end

  defp trusted_click_destination(merchant_product_id) do
    case Repo.get_by(MerchantProduct, id: merchant_product_id, is_active: true) do
      %MerchantProduct{} = merchant_product ->
        {:ok, destination_from_merchant_product(merchant_product)}

      nil ->
        {:error, :merchant_product_not_found}
    end
  end

  defp destination_from_merchant_product(merchant_product) do
    case affiliate_link_for_merchant_product(merchant_product.id) do
      %AffiliateLink{} = affiliate_link ->
        affiliate_destination_or_fallback(affiliate_link, merchant_product)

      nil ->
        merchant_product_destination(merchant_product)
    end
  end

  defp affiliate_destination_or_fallback(affiliate_link, merchant_product) do
    affiliate_url = normalize_browser_accepted_destination_url(affiliate_link.affiliate_url)

    if CommerceLink.valid_destination_url?(affiliate_url) do
      %{
        destination_url: affiliate_url,
        affiliate_program_id: affiliate_program_id(affiliate_link, merchant_product),
        link_type: :affiliate,
        merchant_id: merchant_product.merchant_id,
        network: commerce_network(affiliate_link),
        backfilled_from_affiliate_links: true
      }
    else
      merchant_product_destination(merchant_product)
    end
  end

  defp merchant_product_destination(merchant_product) do
    %{
      destination_url: normalize_browser_accepted_destination_url(merchant_product.url),
      affiliate_program_id: nil,
      link_type: :non_affiliate,
      merchant_id: merchant_product.merchant_id,
      network: nil,
      backfilled_from_affiliate_links: false
    }
  end

  defp normalize_browser_accepted_destination_url(url) when is_binary(url) do
    url
    |> String.trim()
    |> String.replace("\\", "/")
    |> String.replace(" ", "%20")
  end

  defp normalize_browser_accepted_destination_url(url), do: url

  defp affiliate_link_for_merchant_product(merchant_product_id) do
    AffiliateLink
    |> Repo.get_by(merchant_product_id: merchant_product_id)
    |> Repo.preload(:affiliate_network)
  end

  defp affiliate_program_id(
         %AffiliateLink{affiliate_network_id: affiliate_network_id},
         %MerchantProduct{merchant_id: merchant_id}
       )
       when is_integer(affiliate_network_id) and is_integer(merchant_id) do
    case Repo.get_by(AffiliateProgram,
           affiliate_network_id: affiliate_network_id,
           merchant_id: merchant_id
         ) do
      %AffiliateProgram{id: affiliate_program_id} -> affiliate_program_id
      nil -> nil
    end
  end

  defp affiliate_program_id(_affiliate_link, _merchant_product), do: nil

  defp commerce_network(%AffiliateLink{affiliate_network: %{name: name}}) when is_binary(name) do
    name
    |> String.downcase()
    |> String.trim()
    |> then(&Map.get(@affiliate_network_names, &1))
  end

  defp commerce_network(_affiliate_link), do: nil

  defp redirect_destination_url(%{
         destination_url: destination_url,
         link_type: :affiliate,
         network: :impact,
         click_id: click_id
       }) do
    append_public_click_id(destination_url, click_id)
  end

  defp redirect_destination_url(%{destination_url: destination_url}), do: destination_url

  defp append_public_click_id(destination_url, click_id) do
    uri = URI.parse(destination_url)
    query = uri.query || ""

    if has_click_id_query_param?(query) do
      destination_url
    else
      %{uri | query: append_click_id_query_param(query, click_id)}
      |> URI.to_string()
    end
  end

  defp has_click_id_query_param?(query) do
    query
    |> URI.decode_query()
    |> Map.keys()
    |> Enum.any?(&MapSet.member?(@click_id_query_keys, &1))
  end

  defp append_click_id_query_param("", click_id), do: URI.encode_query(%{"ClickId" => click_id})

  defp append_click_id_query_param(query, click_id),
    do: query <> "&" <> URI.encode_query(%{"ClickId" => click_id})

  defp persist_tracked_click(attrs, destination) do
    Repo.transaction(fn ->
      with {:ok, commerce_link} <- upsert_commerce_link(tracked_commerce_link_attrs(destination)),
           :ok <- ensure_commerce_link_active(commerce_link),
           {:ok, click_session} <-
             create_click_session(click_session_attrs(attrs, commerce_link.id)) do
        %{
          commerce_link: commerce_link,
          click_session: click_session,
          redirect_path: "/r/#{click_session.click_id}"
        }
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp unwrap_transaction({:ok, tracked_click}), do: {:ok, tracked_click}
  defp unwrap_transaction({:error, reason}), do: {:error, reason}

  defp tracked_commerce_link_attrs(destination) do
    destination
    |> commerce_link_attrs()
    |> Map.delete(:is_active)
    |> drop_nil_tracked_network()
  end

  defp drop_nil_tracked_network(%{network: nil} = attrs), do: Map.delete(attrs, :network)
  defp drop_nil_tracked_network(attrs), do: attrs

  defp ensure_commerce_link_active(%CommerceLink{is_active: true}), do: :ok

  defp ensure_commerce_link_active(%CommerceLink{is_active: false}),
    do: {:error, :merchant_product_not_found}

  defp commerce_link_attrs(destination) do
    %{
      merchant_id: destination.merchant_id,
      affiliate_program_id: destination.affiliate_program_id,
      destination_url: destination.destination_url,
      link_type: destination.link_type,
      network: destination.network,
      backfilled_from_affiliate_links: destination.backfilled_from_affiliate_links,
      is_active: true
    }
  end

  defp click_session_attrs(attrs, commerce_link_id) do
    attrs
    |> take_click_session_attrs()
    |> Map.put(:commerce_link_id, commerce_link_id)
    |> Map.put_new(:source_surface, :web)
  end

  defp take_click_session_attrs(attrs) do
    Enum.reduce(
      [
        :user_id,
        :merchant_product_id,
        :anonymous_id,
        :source_surface,
        :referrer,
        :user_agent_hash,
        :ip_hash
      ],
      %{},
      fn
        field, acc ->
          case Input.fetch_attr(attrs, field) do
            nil -> acc
            value -> Map.put(acc, field, value)
          end
      end
    )
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

  defp resolve_click_attribution(attrs) do
    changeset = CommerceConversion.changeset(%CommerceConversion{}, attrs)

    case resolved_click_session(attrs, changeset) do
      nil ->
        {:ok, attrs}

      %CommerceClickSession{} = click_session ->
        click_session = Repo.preload(click_session, [:commerce_link, :merchant_product])
        dimensions = click_session_attribution_dimensions(click_session)

        case conflicting_click_dimensions(attrs, changeset, dimensions) do
          [] -> {:ok, put_click_session_attribution_attrs(attrs, click_session, dimensions)}
          conflicts -> {:error, conflicts}
        end
    end
  end

  defp put_click_session_attribution_attrs(attrs, click_session, dimensions) do
    attrs
    |> put_attr(:click_session_id, click_session.id)
    |> put_attr_if_missing(:merchant_id, dimensions.merchant_id)
    |> put_attr_if_missing(:affiliate_program_id, dimensions.affiliate_program_id)
    |> put_attr_if_missing(:merchant_product_id, dimensions.merchant_product_id)
    |> put_attr_if_missing(:product_id, dimensions.product_id)
  end

  defp click_session_attribution_dimensions(click_session) do
    %{
      merchant_id: click_session_merchant_id(click_session),
      affiliate_program_id: click_session_affiliate_program_id(click_session),
      merchant_product_id: click_session.merchant_product_id,
      product_id: click_session_product_id(click_session)
    }
  end

  defp conflicting_click_dimensions(attrs, changeset, dimensions) do
    direct_conflicts =
      for {field, click_value} <- dimensions,
          provider_value = cast_provider_dimension(attrs, changeset, field),
          not is_nil(click_value),
          not is_nil(provider_value),
          provider_value != click_value,
          do: field

    (direct_conflicts ++
       affiliate_program_relation_conflicts(attrs, changeset, dimensions) ++
       merchant_product_relation_conflicts(attrs, changeset, dimensions))
    |> Enum.uniq()
  end

  defp affiliate_program_relation_conflicts(attrs, changeset, %{merchant_id: merchant_id})
       when not is_nil(merchant_id) do
    case cast_provider_dimension(attrs, changeset, :affiliate_program_id) do
      nil ->
        []

      affiliate_program_id ->
        case Repo.get(AffiliateProgram, affiliate_program_id) do
          %AffiliateProgram{merchant_id: ^merchant_id} -> []
          %AffiliateProgram{} -> [:affiliate_program_id]
          nil -> []
        end
    end
  end

  defp affiliate_program_relation_conflicts(_attrs, _changeset, _dimensions), do: []

  defp merchant_product_relation_conflicts(attrs, changeset, dimensions) do
    case cast_provider_dimension(attrs, changeset, :merchant_product_id) do
      nil ->
        []

      merchant_product_id ->
        case Repo.get(MerchantProduct, merchant_product_id) do
          %MerchantProduct{} = merchant_product ->
            if merchant_product_matches_click?(merchant_product, dimensions) do
              []
            else
              [:merchant_product_id]
            end

          nil ->
            []
        end
    end
  end

  defp merchant_product_matches_click?(merchant_product, dimensions) do
    matches_click_dimension?(merchant_product.merchant_id, dimensions.merchant_id) and
      matches_click_dimension?(merchant_product.product_id, dimensions.product_id)
  end

  defp matches_click_dimension?(_provider_value, nil), do: true
  defp matches_click_dimension?(provider_value, click_value), do: provider_value == click_value

  defp cast_provider_dimension(attrs, changeset, field) do
    if Input.attr_key_present?(attrs, field) do
      Ecto.Changeset.get_field(changeset, field)
    end
  end

  defp attribution_conflict_changeset(attrs, conflicts) do
    Enum.reduce(
      conflicts,
      CommerceConversion.changeset(%CommerceConversion{}, attrs),
      &Ecto.Changeset.add_error(&2, &1, "does not match resolved click")
    )
  end

  defp resolved_click_session(attrs, changeset) do
    case Input.fetch_attr(attrs, :click_session_id) do
      nil ->
        attrs
        |> Input.fetch_attr(:public_click_id)
        |> get_click_session_by_public_id()

      _click_session_id ->
        changeset
        |> Ecto.Changeset.get_field(:click_session_id)
        |> get_click_session_by_id()
    end
  end

  defp get_click_session_by_id(nil), do: nil

  defp get_click_session_by_id(click_session_id),
    do: Repo.get(CommerceClickSession, click_session_id)

  defp click_session_merchant_id(%CommerceClickSession{commerce_link: %CommerceLink{} = link}),
    do: link.merchant_id

  defp click_session_merchant_id(%CommerceClickSession{
         merchant_product: %MerchantProduct{} = product
       }),
       do: product.merchant_id

  defp click_session_merchant_id(_click_session), do: nil

  defp click_session_affiliate_program_id(%CommerceClickSession{
         commerce_link: %CommerceLink{} = link
       }),
       do: link.affiliate_program_id

  defp click_session_affiliate_program_id(_click_session), do: nil

  defp click_session_product_id(%CommerceClickSession{
         merchant_product: %MerchantProduct{} = product
       }),
       do: product.product_id

  defp click_session_product_id(_click_session), do: nil

  defp get_click_session_by_public_id(nil), do: nil

  defp get_click_session_by_public_id(click_id) do
    with {:ok, cast_click_id} <- Ecto.UUID.cast(click_id) do
      Repo.get_by(CommerceClickSession, click_id: cast_click_id)
    else
      :error -> nil
    end
  end

  defp put_default_attribution_confidence(attrs) do
    cond do
      Input.attr_key_present?(attrs, :attribution_confidence) ->
        attrs

      attr_present?(attrs, :click_session_id) ->
        put_attr(attrs, :attribution_confidence, :high)

      true ->
        attrs
    end
  end

  defp present_upsert_fields(attrs, changeset, fields) do
    for field <- fields,
        Input.attr_key_present?(attrs, field),
        do: {field, Ecto.Changeset.get_field(changeset, field)}
  end

  defp put_attr(attrs, key, value) when is_map(attrs), do: Map.put(attrs, key, value)
  defp put_attr(attrs, _key, _value), do: attrs

  defp put_attr_if_missing(attrs, _key, nil), do: attrs

  defp put_attr_if_missing(attrs, key, value) do
    if attr_present?(attrs, key) do
      attrs
    else
      put_attr(attrs, key, value)
    end
  end

  defp attr_present?(attrs, key), do: not is_nil(Input.fetch_attr(attrs, key))
end
