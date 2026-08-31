defmodule ProductCompare.Ingestion.CJImportPriceQuality do
  @moduledoc """
  Safe read-only price quality aggregate for CJ-linked imported offers.

  The summary uses CJ source-scoped merchant identities to find distinct merchant
  products, then returns aggregate price coverage counts only. It does not
  expose offer URLs, raw artifacts, tracking parameters, or provider payloads.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.CJSource
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Reference.Currency

  @provider "cj"
  @default_stale_price_hours 168
  @min_stale_price_hours 1

  defmacrop normalized_currency(value) do
    quote do
      fragment("COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')", unquote(value))
    end
  end

  @type currency_count :: %{currency: String.t(), merchant_product_count: non_neg_integer()}

  @type summary :: %{
          provider: String.t(),
          stale_price_hours: pos_integer(),
          merchant_product_count: non_neg_integer(),
          with_price_count: non_neg_integer(),
          without_price_count: non_neg_integer(),
          active_count: non_neg_integer(),
          inactive_count: non_neg_integer(),
          fresh_price_count: non_neg_integer(),
          stale_price_count: non_neg_integer(),
          currency_counts: [currency_count()]
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(opts \\ []) do
    opts = opts(opts)
    now = option(opts, :now, DateTime.utc_now())
    stale_price_hours = stale_price_hours(opts)
    stale_after = DateTime.add(now, -stale_price_hours, :hour)
    merchant_products = cj_merchant_products_query()
    latest_prices = latest_prices_query(merchant_products)
    coverage = coverage_counts(merchant_products, latest_prices, stale_after)

    Map.merge(coverage, %{
      provider: @provider,
      stale_price_hours: stale_price_hours,
      currency_counts: currency_counts(merchant_products)
    })
  end

  defp opts(opts) when is_list(opts) do
    if Keyword.keyword?(opts), do: Map.new(opts), else: %{}
  end

  defp opts(opts) when is_map(opts), do: opts
  defp opts(_opts), do: %{}

  defp stale_price_hours(opts) do
    opts
    |> option(:stale_price_hours, @default_stale_price_hours)
    |> normalize_stale_price_hours()
    |> max(@min_stale_price_hours)
  end

  defp option(opts, key, default),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key), default))

  defp normalize_stale_price_hours(value) when is_integer(value), do: value
  defp normalize_stale_price_hours(_value), do: @default_stale_price_hours

  defp cj_merchant_products_query do
    MerchantProduct
    |> join(:inner, [merchant_product], identity in MerchantSourceIdentity,
      on: identity.merchant_id == merchant_product.merchant_id
    )
    |> join(:inner, [_merchant_product, identity], source in subquery(CJSource.query()),
      on: source.id == identity.source_id
    )
    |> join(:inner, [merchant_product, _identity, _source], currency in Currency,
      on: currency.id == merchant_product.currency
    )
    |> distinct([merchant_product], merchant_product.id)
    |> select([merchant_product, _identity, _source, currency], %{
      id: merchant_product.id,
      currency: currency.code,
      is_active: merchant_product.is_active
    })
  end

  defp latest_prices_query(merchant_products) do
    PricePoint
    |> join(:inner, [price_point], merchant_product in subquery(merchant_products),
      on: merchant_product.id == price_point.merchant_product_id
    )
    |> group_by([price_point], price_point.merchant_product_id)
    |> select([price_point], %{
      merchant_product_id: price_point.merchant_product_id,
      latest_observed_at: max(price_point.observed_at)
    })
  end

  defp coverage_counts(merchant_products, latest_prices, stale_after) do
    merchant_products
    |> subquery()
    |> join(:left, [merchant_product], latest_price in subquery(latest_prices),
      on: latest_price.merchant_product_id == merchant_product.id
    )
    |> select([merchant_product, latest_price], %{
      merchant_product_count: count(merchant_product.id),
      with_price_count:
        filter(count(merchant_product.id), not is_nil(latest_price.latest_observed_at)),
      without_price_count:
        filter(count(merchant_product.id), is_nil(latest_price.latest_observed_at)),
      active_count: filter(count(merchant_product.id), merchant_product.is_active == true),
      inactive_count: filter(count(merchant_product.id), merchant_product.is_active == false),
      fresh_price_count:
        filter(count(merchant_product.id), latest_price.latest_observed_at >= ^stale_after),
      stale_price_count:
        filter(count(merchant_product.id), latest_price.latest_observed_at < ^stale_after)
    })
    |> Repo.one()
  end

  defp currency_counts(merchant_products) do
    merchant_products
    |> subquery()
    |> group_by([merchant_product], normalized_currency(merchant_product.currency))
    |> order_by([merchant_product],
      desc: count(merchant_product.id),
      asc: normalized_currency(merchant_product.currency)
    )
    |> select([merchant_product], %{
      currency: normalized_currency(merchant_product.currency),
      merchant_product_count: count(merchant_product.id)
    })
    |> Repo.all()
  end
end
