defmodule ProductCompare.Pricing.TruthReads do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Pricing.PriceHistory
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.MerchantProduct

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

  defp normalize_product_ids(product_ids) do
    product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end
end
