defmodule ProductCompare.Pricing.HomeOffers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}

  @max_bigint_id 9_223_372_036_854_775_807
  @homepage_currency "USD"

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
    limit = opts |> Keyword.get(:limit, 6) |> bounded_limit(6)

    :all
    |> winners_query(now, false)
    |> where([offer], offer.new_offer? or offer.below_30_day_median?)
    |> order_by([offer],
      asc: offer.landed_price,
      desc: offer.observed_at,
      asc: offer.product_id
    )
    |> limit(^limit)
    |> Repo.all()
    |> Map.new(fn row -> {row.product_id, Map.delete(row, :product_id)} end)
  end

  @spec new_deal_candidates(keyword()) :: [map()]
  def new_deal_candidates(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    limit = opts |> Keyword.get(:limit, 6) |> bounded_limit(6)

    :all
    |> winners_query(now, true, false)
    |> order_by([offer],
      asc: offer.landed_price,
      desc: offer.observed_at,
      asc: offer.product_id
    )
    |> limit(^limit)
    |> Repo.all()
  end

  @spec trending_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def trending_deal_candidates(activity_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    limit = opts |> Keyword.get(:limit, 6) |> bounded_limit(6)

    :all
    |> winners_query(now, false)
    |> join(:inner, [offer], activity in subquery(activity_query),
      on: activity.product_id == offer.product_id
    )
    |> where([offer], offer.below_30_day_median? == true)
    |> order_by([offer, _counts, activity],
      desc: activity.identity_count,
      desc: activity.activity_at,
      asc: offer.product_id
    )
    |> limit(^limit)
    |> Repo.all()
  end

  @spec viewer_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def viewer_deal_candidates(relevance_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    limit = opts |> Keyword.get(:limit, 6) |> bounded_limit(6)

    product_ids = candidate_product_ids_query(relevance_query)
    active_counts = active_counts_query(product_ids)

    ranked_viewer_offers =
      product_ids
      |> eligible_offers_query(now, false, true)
      |> subquery()
      |> join(:inner, [offer], counts in subquery(active_counts),
        on: counts.product_id == offer.product_id
      )
      |> join(:inner, [offer, _counts], relevance in subquery(relevance_query),
        on: relevance.product_id == offer.product_id
      )
      |> where(
        [offer, _counts, relevance],
        relevance.reason_rank != 0 or
          (offer.landed_price <= relevance.watch_target and
             (is_nil(relevance.merchant_product_id) or
                relevance.merchant_product_id == offer.merchant_product_id))
      )
      |> windows(
        [offer, _counts, relevance],
        viewer_product: [
          partition_by: offer.product_id,
          order_by: [
            asc: relevance.reason_rank,
            asc: relevance.watch_target,
            asc: offer.landed_price,
            asc: offer.merchant_product_id
          ]
        ]
      )
      |> select([offer, counts, relevance], %{
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
        below_30_day_median?: offer.below_30_day_median?,
        reason_rank: relevance.reason_rank,
        watch_target: relevance.watch_target,
        viewer_rank: over(row_number(), :viewer_product)
      })

    ranked_viewer_offers
    |> subquery()
    |> where([offer], offer.viewer_rank == 1)
    |> order_by([offer],
      asc: offer.reason_rank,
      desc:
        fragment(
          "greatest(coalesce(?, ?) - ?, 0)",
          offer.median_30d,
          offer.landed_price,
          offer.landed_price
        ),
      desc: offer.observed_at,
      asc: offer.product_id
    )
    |> limit(^limit)
    |> Repo.all()
  end

  defp winners_query(product_ids, now, only_new, include_median \\ true)

  defp winners_query([], _now, _only_new, _include_median),
    do: from(offer in MerchantProduct, where: false)

  defp winners_query(product_ids, now, only_new, include_median) do
    active_counts = active_counts_query(product_ids)

    ranked_offers =
      product_ids
      |> eligible_offers_query(now, only_new, include_median)
      |> subquery()
      |> windows(
        [offer],
        home_offer: [
          partition_by: [:product_id, :currency],
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
        new_offer?: offer.new_offer?,
        below_30_day_median?: offer.below_30_day_median?,
        rank: over(row_number(), :home_offer)
      })

    ranked_offers
    |> subquery()
    |> join(:inner, [offer], counts in subquery(active_counts),
      on: counts.product_id == offer.product_id
    )
    |> where([offer], offer.rank == 1)
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

  defp eligible_offers_query(product_ids, now, only_new, include_median) do
    latest_prices = latest_prices_query(product_ids)
    first_seen = first_seen_query(product_ids)
    medians = medians_query(product_ids, now, include_median)

    MerchantProduct
    |> maybe_filter_product_ids(product_ids)
    |> join(:inner, [offer], merchant in Merchant, on: merchant.id == offer.merchant_id)
    |> join(:inner, [offer], latest in subquery(latest_prices),
      on: latest.merchant_product_id == offer.id
    )
    |> join(:inner, [offer], first in subquery(first_seen),
      on: first.merchant_product_id == offer.id
    )
    |> join(:left, [offer], median in subquery(medians),
      on: median.product_id == offer.product_id and median.currency == offer.currency
    )
    |> where(
      [offer, _merchant, latest],
      offer.is_active == true and offer.currency == ^@homepage_currency and
        latest.in_stock == true and not is_nil(latest.shipping) and
        latest.observed_at >= ^DateTime.add(now, -86_400, :second)
    )
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
    |> subquery()
    |> then(fn eligible -> from(offer in eligible) end)
    |> maybe_filter_new(only_new)
  end

  defp latest_prices_query(product_ids) do
    PricePoint
    |> join(:inner, [price], offer in MerchantProduct, on: offer.id == price.merchant_product_id)
    |> maybe_filter_price_product_ids(product_ids)
    |> distinct([price], price.merchant_product_id)
    |> order_by([price],
      asc: price.merchant_product_id,
      desc: price.observed_at,
      desc: price.id
    )
    |> select([price], price)
  end

  defp first_seen_query(product_ids) do
    PricePoint
    |> join(:inner, [price], offer in MerchantProduct, on: offer.id == price.merchant_product_id)
    |> maybe_filter_price_product_ids(product_ids)
    |> group_by([price], price.merchant_product_id)
    |> select([price], %{
      merchant_product_id: price.merchant_product_id,
      first_seen_at: min(price.observed_at)
    })
  end

  defp medians_query(_product_ids, _now, false) do
    from offer in MerchantProduct,
      where: false,
      select: %{
        product_id: offer.product_id,
        currency: offer.currency,
        median_30d: type(fragment("NULL"), :decimal)
      }
  end

  defp medians_query(product_ids, now, true) do
    PricePoint
    |> join(:inner, [price], offer in MerchantProduct, on: offer.id == price.merchant_product_id)
    |> maybe_filter_price_product_ids(product_ids)
    |> where(
      [price, offer],
      offer.currency == ^@homepage_currency and
        not is_nil(price.shipping) and
        price.observed_at >= ^DateTime.add(now, -2_592_000, :second)
    )
    |> group_by([_price, offer], [offer.product_id, offer.currency])
    |> select([price, offer], %{
      product_id: offer.product_id,
      currency: offer.currency,
      median_30d:
        type(
          fragment(
            "percentile_cont(0.5) WITHIN GROUP (ORDER BY (? + ?))",
            price.price,
            price.shipping
          ),
          :decimal
        )
    })
  end

  defp active_counts_query(product_ids) do
    MerchantProduct
    |> maybe_filter_product_ids(product_ids)
    |> where([offer], offer.is_active == true and offer.currency == ^@homepage_currency)
    |> group_by([offer], offer.product_id)
    |> select([offer], %{product_id: offer.product_id, active_offer_count: count(offer.id)})
  end

  defp candidate_product_ids_query(relevance_query) do
    relevance_query
    |> subquery()
    |> distinct([candidate], candidate.product_id)
    |> select([candidate], %{product_id: candidate.product_id})
  end

  defp maybe_filter_new(query, false), do: query
  defp maybe_filter_new(query, true), do: where(query, [offer], offer.new_offer? == true)

  defp maybe_filter_product_ids(query, :all), do: query

  defp maybe_filter_product_ids(query, %Ecto.Query{} = product_ids_query),
    do: where(query, [offer], offer.product_id in subquery(product_ids_query))

  defp maybe_filter_product_ids(query, product_ids),
    do: where(query, [offer], offer.product_id in ^product_ids)

  defp maybe_filter_price_product_ids(query, :all), do: query

  defp maybe_filter_price_product_ids(query, %Ecto.Query{} = product_ids_query),
    do: where(query, [_price, offer], offer.product_id in subquery(product_ids_query))

  defp maybe_filter_price_product_ids(query, product_ids),
    do: where(query, [_price, offer], offer.product_id in ^product_ids)

  defp normalize_product_ids(:all), do: :all

  defp normalize_product_ids(product_ids) when is_list(product_ids),
    do: product_ids |> Enum.filter(&valid_id?/1) |> Enum.uniq() |> Enum.take(6)

  defp normalize_product_ids(_), do: []
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id

  defp bounded_limit(limit, _default) when is_integer(limit) and limit > 0, do: min(limit, 6)
  defp bounded_limit(_limit, default), do: default
end
