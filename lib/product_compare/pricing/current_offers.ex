defmodule ProductCompare.Pricing.CurrentOffers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Pricing.PriceHistory
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct}

  @max_bigint_id 9_223_372_036_854_775_807

  @spec current_offer_truths([pos_integer()], keyword()) :: %{optional(pos_integer()) => map()}
  def current_offer_truths(product_ids, opts \\ []) when is_list(product_ids) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    product_ids = normalize_product_ids(product_ids)

    if product_ids == [] do
      %{}
    else
      merchant_products =
        MerchantProduct
        |> where(
          [merchant_product],
          merchant_product.product_id in ^product_ids and merchant_product.is_active == true
        )
        |> order_by([merchant_product],
          asc: merchant_product.product_id,
          asc: merchant_product.id
        )
        |> Repo.all()

      price_points_by_merchant_product =
        merchant_products
        |> Enum.map(& &1.id)
        |> PriceHistory.latest_offer_truth_prices()

      merchant_products_by_product = Enum.group_by(merchant_products, & &1.product_id)

      Map.new(product_ids, fn product_id ->
        offers =
          merchant_products_by_product
          |> Map.get(product_id, [])
          |> Enum.map(fn merchant_product ->
            OfferTruth.summarize(
              merchant_product,
              Map.get(price_points_by_merchant_product, merchant_product.id),
              now,
              opts
            )
          end)

        {product_id, OfferTruth.summarize_product(offers, now, opts)}
      end)
    end
  end

  @spec current_offer_truth(term(), keyword()) :: map()
  def current_offer_truth(product_id, opts \\ [])

  def current_offer_truth(product_id, opts)
      when is_integer(product_id) and product_id > 0 and product_id <= @max_bigint_id do
    current_offer_truths([product_id], opts)
    |> Map.fetch!(product_id)
  end

  def current_offer_truth(_product_id, opts) do
    OfferTruth.summarize_product([], Keyword.get(opts, :now, DateTime.utc_now()), opts)
  end

  @spec eligible_query(:all | [pos_integer()] | Ecto.Query.t(), keyword()) :: Ecto.Query.t()
  def eligible_query(product_ids, opts) do
    now = Keyword.fetch!(opts, :now)
    currency = Keyword.fetch!(opts, :currency)
    fresh_after = Keyword.fetch!(opts, :fresh_after)
    inserted_after = Keyword.get(opts, :inserted_after)

    case product_ids do
      [] -> empty_eligible_query()
      product_ids -> eligible_query(product_ids, now, currency, fresh_after, inserted_after)
    end
  end

  @spec with_first_observation(Ecto.Query.t(), DateTime.t()) :: Ecto.Query.t()
  def with_first_observation(query, %DateTime{} = at) do
    query
    |> join(
      :inner_lateral,
      [offer: _offer],
      first in subquery(PriceHistory.first_observation_for_offer_query(at)),
      on: true,
      as: :first_observation
    )
    |> select_merge([first_observation: first], %{first_seen_at: first.observed_at})
  end

  @spec with_median(Ecto.Query.t(), [pos_integer()] | Ecto.Query.t(), keyword()) :: Ecto.Query.t()
  def with_median(query, product_ids, opts) do
    medians = PriceHistory.landed_price_medians_query(product_ids, opts)

    case product_ids do
      [] ->
        select_merge(query, [offer: _offer], %{
          median_30d: type(fragment("NULL"), :decimal),
          below_30_day_median?: false
        })

      _nonempty_scope ->
        query
        |> join(:left, [offer: offer], median in subquery(medians),
          on: median.product_id == offer.product_id and median.currency == offer.currency,
          as: :median
        )
        |> select_merge([latest_observation: latest, median: median], %{
          median_30d: median.median,
          below_30_day_median?:
            not is_nil(median.median) and latest.price + latest.shipping < median.median
        })
    end
  end

  defp eligible_query(product_ids, now, currency, fresh_after, inserted_after) do
    candidate_offers =
      MerchantProduct
      |> filter_product_ids(product_ids)
      |> filter_currency(currency)
      |> where([offer], offer.is_active == true)
      |> filter_inserted_after(inserted_after)

    candidate_offers
    |> subquery()
    |> from(as: :offer)
    |> join(:inner, [offer: offer], merchant in Merchant,
      on: merchant.id == offer.merchant_id,
      as: :merchant
    )
    |> join(
      :inner_lateral,
      [offer: _offer],
      latest in subquery(PriceHistory.latest_observation_for_offer_query(now)),
      on: true,
      as: :latest_observation
    )
    |> where(
      [latest_observation: latest],
      latest.in_stock == true and not is_nil(latest.shipping) and
        latest.observed_at >= ^fresh_after
    )
    |> select([offer: offer, merchant: merchant, latest_observation: latest], %{
      product_id: offer.product_id,
      merchant_id: offer.merchant_id,
      merchant_product_id: offer.id,
      merchant_name: merchant.name,
      currency: offer.currency,
      landed_price: latest.price + latest.shipping,
      observed_at: latest.observed_at,
      inserted_at: offer.inserted_at
    })
  end

  defp empty_eligible_query do
    from offer in MerchantProduct,
      as: :offer,
      where: false,
      select: %{
        product_id: offer.product_id,
        merchant_id: offer.merchant_id,
        merchant_product_id: offer.id,
        merchant_name: type(fragment("NULL"), :string),
        currency: offer.currency,
        landed_price: type(fragment("NULL"), :decimal),
        observed_at: type(fragment("NULL"), :utc_datetime_usec),
        inserted_at: offer.inserted_at
      }
  end

  defp filter_product_ids(query, :all), do: query

  defp filter_product_ids(query, %Ecto.Query{} = product_ids_query),
    do: where(query, [offer], offer.product_id in subquery(product_ids_query))

  defp filter_product_ids(query, product_ids) when is_list(product_ids),
    do: where(query, [offer], offer.product_id in ^product_ids)

  defp filter_currency(query, :all), do: query
  defp filter_currency(query, currency), do: where(query, [offer], offer.currency == ^currency)

  defp filter_inserted_after(query, nil), do: query

  defp filter_inserted_after(query, %DateTime{} = inserted_after),
    do: where(query, [offer], offer.inserted_at >= ^inserted_after)

  defp normalize_product_ids(product_ids) do
    product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end
end
