defmodule ProductCompare.Alerts.MarketFacts do
  @moduledoc false

  alias ProductCompare.Pricing
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @spec current_scope_fact(map(), String.t() | term(), DateTime.t(), PricePoint.t() | nil) ::
          map()
  def current_scope_fact(scope, currency, now, triggering_price_point \\ nil)

  def current_scope_fact(%{merchant_product_id: merchant_product_id}, currency, now, _trigger)
      when is_integer(merchant_product_id) do
    merchant_product = Repo.get!(MerchantProduct, merchant_product_id)
    price_point = Pricing.latest_price(merchant_product_id)

    merchant_product
    |> OfferTruth.summarize(price_point, now)
    |> fact_from_offer(currency)
  end

  def current_scope_fact(%{product_id: product_id}, currency, now, triggering_price_point) do
    best_offer =
      product_id
      |> Pricing.current_offer_truth(now: now)
      |> Map.fetch!(:currency_summaries)
      |> Enum.find(&(&1.currency == currency))
      |> case do
        nil -> nil
        summary -> summary.best_offer
      end

    fallback_offer =
      case triggering_price_point do
        %PricePoint{merchant_product: %MerchantProduct{} = merchant_product} ->
          OfferTruth.summarize(merchant_product, triggering_price_point, now)

        _ ->
          nil
      end

    fact_from_offer(best_offer || fallback_offer, currency)
  end

  @spec eligible_baseline(map()) :: map() | nil
  def eligible_baseline(%{eligible: true, landed_price: %Decimal{}} = fact), do: fact
  def eligible_baseline(_fact), do: nil

  defp fact_from_offer(nil, currency), do: empty_fact(currency)

  defp fact_from_offer(%{currency: currency} = offer, currency) do
    %{
      eligible: offer.eligible,
      currency: currency,
      merchant_product_id: offer.merchant_product_id,
      price_point_id: Map.get(offer, :price_point_id),
      item_price: offer.item_price,
      shipping: offer.shipping,
      landed_price: offer.landed_price,
      observed_at: offer.observed_at
    }
  end

  defp fact_from_offer(_offer, currency), do: empty_fact(currency)

  defp empty_fact(currency) do
    %{
      eligible: false,
      currency: currency,
      merchant_product_id: nil,
      price_point_id: nil,
      item_price: nil,
      shipping: nil,
      landed_price: nil,
      observed_at: nil
    }
  end
end
