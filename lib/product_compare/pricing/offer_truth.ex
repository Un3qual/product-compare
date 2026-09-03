defmodule ProductCompare.Pricing.OfferTruth do
  @moduledoc """
  Derives honest current-offer facts from persisted merchant listings and their
  latest price observations.
  """

  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.SourceArtifact

  @default_fresh_for_seconds 86_400
  @default_stale_after_seconds 259_200

  @type freshness :: :fresh | :aging | :stale | :unobserved
  @type stock_status :: :in_stock | :out_of_stock | :unknown

  @spec summarize(MerchantProduct.t(), PricePoint.t() | nil, DateTime.t(), keyword()) :: map()
  def summarize(merchant_product, price_point, now, opts \\ [])

  def summarize(%MerchantProduct{} = merchant_product, nil, %DateTime{} = _now, _opts) do
    %{
      merchant_product_id: merchant_product.id,
      price_point_id: nil,
      currency: merchant_product.currency,
      item_price: nil,
      shipping: nil,
      landed_price: nil,
      landed_price_complete: false,
      stock_status: :unknown,
      freshness: :unobserved,
      observed_at: nil,
      eligible: false,
      source_artifact: nil
    }
  end

  def summarize(
        %MerchantProduct{} = merchant_product,
        %PricePoint{} = price_point,
        %DateTime{} = now,
        opts
      ) do
    stock_status = stock_status(price_point.in_stock)
    freshness = freshness(price_point.observed_at, now, opts)
    landed_price = landed_price(price_point.price, price_point.shipping)
    landed_price_complete = not is_nil(landed_price)

    %{
      merchant_product_id: merchant_product.id,
      price_point_id: price_point.id,
      currency: merchant_product.currency,
      item_price: price_point.price,
      shipping: price_point.shipping,
      landed_price: landed_price,
      landed_price_complete: landed_price_complete,
      stock_status: stock_status,
      freshness: freshness,
      observed_at: price_point.observed_at,
      eligible:
        merchant_product.is_active == true and stock_status == :in_stock and
          freshness in [:fresh, :aging] and landed_price_complete,
      source_artifact: loaded_source_artifact(price_point)
    }
  end

  @spec summarize_product([map()], DateTime.t(), keyword()) :: map()
  def summarize_product(offers, %DateTime{} = now, opts \\ []) do
    policy = policy(opts)

    currency_summaries =
      offers
      |> Enum.group_by(& &1.currency)
      |> Enum.map(fn {currency, currency_offers} ->
        eligible_offers = Enum.filter(currency_offers, & &1.eligible)

        %{
          currency: currency,
          offer_count: length(currency_offers),
          observed_offer_count: Enum.count(currency_offers, & &1.observed_at),
          eligible_offer_count: length(eligible_offers),
          best_offer: best_offer(eligible_offers)
        }
      end)
      |> Enum.sort_by(& &1.currency)

    %{
      as_of: now,
      fresh_for_seconds: policy.fresh_for_seconds,
      stale_after_seconds: policy.stale_after_seconds,
      offer_count: length(offers),
      observed_offer_count: Enum.count(offers, & &1.observed_at),
      eligible_offer_count: Enum.count(offers, & &1.eligible),
      currency_summaries: currency_summaries
    }
  end

  @spec policy(keyword()) :: %{
          fresh_for_seconds: pos_integer(),
          stale_after_seconds: pos_integer()
        }
  def policy(opts \\ []) do
    fresh_for_seconds =
      positive_integer(Keyword.get(opts, :fresh_for_seconds), @default_fresh_for_seconds)

    stale_after_seconds =
      opts
      |> Keyword.get(:stale_after_seconds)
      |> positive_integer(@default_stale_after_seconds)
      |> max(fresh_for_seconds)

    %{
      fresh_for_seconds: fresh_for_seconds,
      stale_after_seconds: stale_after_seconds
    }
  end

  defp freshness(observed_at, now, opts) do
    age_seconds = max(DateTime.diff(now, observed_at, :second), 0)
    policy = policy(opts)

    cond do
      age_seconds <= policy.fresh_for_seconds -> :fresh
      age_seconds <= policy.stale_after_seconds -> :aging
      true -> :stale
    end
  end

  defp stock_status(true), do: :in_stock
  defp stock_status(false), do: :out_of_stock
  defp stock_status(_unknown), do: :unknown

  defp landed_price(%Decimal{} = price, %Decimal{} = shipping),
    do: Decimal.add(price, shipping)

  defp landed_price(_price, _shipping), do: nil

  defp best_offer([]), do: nil

  defp best_offer([first | rest]) do
    Enum.reduce(rest, first, fn candidate, best ->
      case Decimal.compare(candidate.landed_price, best.landed_price) do
        :lt ->
          candidate

        :gt ->
          best

        :eq ->
          if candidate.merchant_product_id < best.merchant_product_id, do: candidate, else: best
      end
    end)
  end

  defp loaded_source_artifact(%PricePoint{
         artifact: %SourceArtifact{} = source_artifact
       }),
       do: source_artifact

  defp loaded_source_artifact(_price_point), do: nil

  defp positive_integer(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer(_value, default), do: default
end
