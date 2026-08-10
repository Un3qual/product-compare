defmodule ProductCompare.Pricing.HomeOffers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}

  @max_bigint_id 9_223_372_036_854_775_807

  @spec summaries([term()] | :all, keyword()) :: %{optional(pos_integer()) => map()}
  def summaries(product_ids, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    product_ids = normalize_product_ids(product_ids)

    case product_ids do
      [] -> %{}
      _ -> product_ids |> offers_query(now) |> Repo.all() |> summarize(now) |> public_summaries()
    end
  end

  @spec deal_candidates(keyword()) :: %{optional(pos_integer()) => map()}
  def deal_candidates(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    :all
    |> offers_query(now)
    |> Repo.all()
    |> summarize(now)
    |> Map.filter(fn {_product_id, summary} ->
      summary.new_offer? or summary.below_30_day_median?
    end)
  end

  defp offers_query(product_ids, now) do
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

    MerchantProduct
    |> join(:inner, [offer], merchant in Merchant, on: merchant.id == offer.merchant_id)
    |> join(:left, [offer], latest in subquery(latest_prices),
      on: latest.merchant_product_id == offer.id
    )
    |> join(:left, [offer], first in subquery(first_seen),
      on: first.merchant_product_id == offer.id
    )
    |> join(:left, [offer], median in subquery(medians),
      on: median.product_id == offer.product_id
    )
    |> where([offer], offer.is_active == true)
    |> maybe_filter_product_ids(product_ids)
    |> select([offer, merchant, latest, first, median], %{
      product_id: offer.product_id,
      merchant_product_id: offer.id,
      merchant_name: merchant.name,
      currency: offer.currency,
      price: latest.price,
      shipping: latest.shipping,
      in_stock: latest.in_stock,
      observed_at: latest.observed_at,
      inserted_at: offer.inserted_at,
      first_seen_at: first.first_seen_at,
      median_30d: median.median_30d
    })
    |> order_by([offer], asc: offer.product_id, asc: offer.id)
  end

  defp maybe_filter_product_ids(query, :all), do: query

  defp maybe_filter_product_ids(query, product_ids),
    do: where(query, [offer], offer.product_id in ^product_ids)

  defp summarize(rows, now) do
    rows
    |> Enum.group_by(& &1.product_id)
    |> Map.new(fn {product_id, offers} ->
      eligible = Enum.filter(offers, &eligible_offer?(&1, now))

      case best_offer(eligible) do
        nil -> {product_id, nil}
        best -> {product_id, summary(best, eligible, offers, now)}
      end
    end)
    |> Map.reject(fn {_product_id, summary} -> is_nil(summary) end)
  end

  defp summary(best, eligible, offers, now) do
    new_offer? = Enum.any?(eligible, &new_offer?(&1, now))

    below_median? =
      not is_nil(best.median_30d) and Decimal.compare(landed_price(best), best.median_30d) == :lt

    %{
      merchant_product_id: best.merchant_product_id,
      merchant_name: best.merchant_name,
      currency: best.currency,
      landed_price: landed_price(best),
      observed_at: best.observed_at,
      first_seen_at: best.first_seen_at,
      median_30d: best.median_30d,
      active_offer_count: length(offers),
      new_offer?: new_offer?,
      below_30_day_median?: below_median?
    }
  end

  defp public_summaries(summaries) do
    Map.new(summaries, fn {product_id, summary} ->
      {product_id, Map.drop(summary, [:new_offer?, :below_30_day_median?])}
    end)
  end

  defp eligible_offer?(offer, now) do
    not is_nil(offer.price) and not is_nil(offer.shipping) and offer.in_stock == true and
      not is_nil(offer.observed_at) and offer.observed_at >= DateTime.add(now, -86_400, :second)
  end

  defp new_offer?(offer, now) do
    start = earliest(offer.inserted_at, offer.first_seen_at)
    not is_nil(start) and start >= DateTime.add(now, -259_200, :second)
  end

  defp earliest(nil, right), do: right
  defp earliest(left, nil), do: left
  defp earliest(left, right), do: if(DateTime.compare(left, right) == :gt, do: right, else: left)
  defp landed_price(offer), do: Decimal.add(offer.price, offer.shipping)

  defp best_offer([]), do: nil

  defp best_offer([first | rest]) do
    Enum.reduce(rest, first, fn candidate, best ->
      case Decimal.compare(landed_price(candidate), landed_price(best)) do
        :lt ->
          candidate

        :gt ->
          best

        :eq ->
          if(candidate.merchant_product_id < best.merchant_product_id, do: candidate, else: best)
      end
    end)
  end

  defp normalize_product_ids(:all), do: :all

  defp normalize_product_ids(product_ids) when is_list(product_ids) do
    product_ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()
  end

  defp normalize_product_ids(_), do: []
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id
end
