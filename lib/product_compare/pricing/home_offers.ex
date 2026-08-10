defmodule ProductCompare.Pricing.HomeOffers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}

  @max_bigint_id 9_223_372_036_854_775_807

  @spec summaries([term()] | :all, keyword()) :: %{optional(pos_integer()) => map()}
  def summaries(product_ids, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    product_ids
    |> normalize_product_ids()
    |> winners_query(now, false)
    |> Repo.all()
    |> Map.new(fn row ->
      {row.product_id, Map.drop(row, [:product_id, :new_offer?, :below_30_day_median?])}
    end)
  end

  @spec deal_candidates(keyword()) :: %{optional(pos_integer()) => map()}
  def deal_candidates(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    :all
    |> winners_query(now, true)
    |> Repo.all()
    |> Map.new(fn row -> {row.product_id, Map.delete(row, :product_id)} end)
  end

  defp winners_query([], _now, _deals_only), do: from(offer in MerchantProduct, where: false)

  defp winners_query(product_ids, now, deals_only) do
    active_counts =
      MerchantProduct
      |> maybe_filter_product_ids(product_ids)
      |> where([offer], offer.is_active == true)
      |> group_by([offer], offer.product_id)
      |> select([offer], %{product_id: offer.product_id, active_offer_count: count(offer.id)})

    latest_prices =
      from price in PricePoint,
        distinct: price.merchant_product_id,
        order_by: [asc: price.merchant_product_id, desc: price.observed_at, desc: price.id]

    first_seen =
      from price in PricePoint,
        group_by: price.merchant_product_id,
        select: %{
          merchant_product_id: price.merchant_product_id,
          first_seen_at: min(price.observed_at)
        }

    medians =
      from price in PricePoint,
        join: offer in MerchantProduct,
        on: offer.id == price.merchant_product_id,
        where:
          not is_nil(price.shipping) and
            price.observed_at >= ^DateTime.add(now, -2_592_000, :second),
        group_by: offer.product_id,
        select: %{
          product_id: offer.product_id,
          median_30d:
            type(
              fragment(
                "percentile_cont(0.5) WITHIN GROUP (ORDER BY (? + ?))",
                price.price,
                price.shipping
              ),
              :decimal
            )
        }

    eligible_offers =
      MerchantProduct
      |> join(:inner, [offer], merchant in Merchant, on: merchant.id == offer.merchant_id)
      |> join(:inner, [offer], latest in subquery(latest_prices),
        on: latest.merchant_product_id == offer.id
      )
      |> join(:inner, [offer], first in subquery(first_seen),
        on: first.merchant_product_id == offer.id
      )
      |> join(:left, [offer], median in subquery(medians),
        on: median.product_id == offer.product_id
      )
      |> where(
        [offer, _merchant, latest],
        offer.is_active == true and latest.in_stock == true and not is_nil(latest.shipping) and
          latest.observed_at >= ^DateTime.add(now, -86_400, :second)
      )
      |> maybe_filter_product_ids(product_ids)
      |> select([offer, merchant, latest, first, median], %{
        product_id: offer.product_id,
        merchant_product_id: offer.id,
        merchant_name: merchant.name,
        currency: offer.currency,
        landed_price: latest.price + latest.shipping,
        observed_at: latest.observed_at,
        first_seen_at: first.first_seen_at,
        median_30d: median.median_30d,
        new_offer?:
          fragment(
            "least(?, ?) >= ?",
            offer.inserted_at,
            first.first_seen_at,
            ^DateTime.add(now, -259_200, :second)
          ),
        below_30_day_median?:
          not is_nil(median.median_30d) and
            fragment("(? + ?) < ?", latest.price, latest.shipping, median.median_30d)
      })

    ranked_offers =
      eligible_offers
      |> subquery()
      |> then(fn eligible ->
        from(offer in eligible)
      end)
      |> windows(
        home_offer: [
          partition_by: :product_id,
          order_by: [asc: :landed_price, asc: :merchant_product_id]
        ]
      )
      |> select([offer], %{
        product_id: offer.product_id,
        merchant_product_id: offer.merchant_product_id,
        merchant_name: offer.merchant_name,
        currency: offer.currency,
        landed_price: offer.landed_price,
        observed_at: offer.observed_at,
        first_seen_at: offer.first_seen_at,
        median_30d: offer.median_30d,
        new_offer?:
          type(
            fragment("bool_or(?) OVER (PARTITION BY ?)", offer.new_offer?, offer.product_id),
            :boolean
          ),
        below_30_day_median?:
          type(
            fragment(
              "bool_or(?) OVER (PARTITION BY ?)",
              offer.below_30_day_median?,
              offer.product_id
            ),
            :boolean
          ),
        rank: over(row_number(), :home_offer)
      })

    ranked_offers
    |> subquery()
    |> join(:inner, [offer], counts in subquery(active_counts),
      on: counts.product_id == offer.product_id
    )
    |> where([offer], offer.rank == 1)
    |> maybe_filter_deals(deals_only)
    |> order_by([offer], asc: offer.product_id)
    |> select([offer, counts], %{
      product_id: offer.product_id,
      merchant_product_id: offer.merchant_product_id,
      merchant_name: offer.merchant_name,
      currency: offer.currency,
      landed_price: offer.landed_price,
      observed_at: offer.observed_at,
      first_seen_at: offer.first_seen_at,
      median_30d: offer.median_30d,
      active_offer_count: counts.active_offer_count,
      new_offer?: offer.new_offer?,
      below_30_day_median?: offer.below_30_day_median?
    })
  end

  defp maybe_filter_deals(query, false), do: query

  defp maybe_filter_deals(query, true),
    do: where(query, [offer], offer.new_offer? or offer.below_30_day_median?)

  defp maybe_filter_product_ids(query, :all), do: query

  defp maybe_filter_product_ids(query, product_ids),
    do: where(query, [offer], offer.product_id in ^product_ids)

  defp normalize_product_ids(:all), do: :all

  defp normalize_product_ids(product_ids) when is_list(product_ids),
    do: product_ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()

  defp normalize_product_ids(_), do: []
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id
end
