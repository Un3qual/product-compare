defmodule ProductCompareWeb.Resolvers.PricingResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Pricing.Evidence
  alias ProductCompareWeb.Resolvers.Pricing.Merchants
  alias ProductCompareWeb.Resolvers.Pricing.Offers
  alias ProductCompareSchemas.Specs.SourceArtifact

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchants(parent, args, resolution), do: Merchants.merchants(parent, args, resolution)

  def merchant(parent, args, resolution), do: Merchants.merchant(parent, args, resolution)

  def merchant_detail_summary(parent, args, resolution),
    do: Merchants.merchant_detail_summary(parent, args, resolution)

  def merchant_offers(parent, args, resolution),
    do: Merchants.merchant_offers(parent, args, resolution)

  @spec merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchant_products(parent, args, resolution),
    do: Offers.merchant_products(parent, args, resolution)

  @spec product_merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def product_merchant_products(parent, args, resolution),
    do: Offers.product_merchant_products(parent, args, resolution)

  @spec latest_price(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Pricing.PricePoint.t() | nil}
  def latest_price(parent, args, resolution),
    do: Offers.latest_price(parent, args, resolution)

  @spec source_artifact(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, SourceArtifact.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(parent, args, resolution),
    do: Evidence.source_artifact(parent, args, resolution)

  @spec product_offer_truth(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_offer_truth(parent, args, resolution),
    do: Offers.product_offer_truth(parent, args, resolution)

  @spec price_history(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def price_history(parent, args, resolution),
    do: Offers.price_history(parent, args, resolution)
end
