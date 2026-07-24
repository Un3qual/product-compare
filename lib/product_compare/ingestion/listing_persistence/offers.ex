defmodule ProductCompare.Ingestion.ListingPersistence.Offers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @price_point_conflict_target {:unsafe_fragment,
                                "(merchant_product_id, observed_at, artifact_id) WHERE artifact_id IS NOT NULL"}

  @spec persist_offer(map(), map(), map(), map()) ::
          {:ok, {MerchantProduct.t(), PricePoint.t() | nil}} | {:error, term()}
  def persist_offer(merchant_identity, product, source_artifact, listing) do
    with {:ok, merchant_product} <-
           upsert_listing_merchant_product(merchant_identity, product, listing),
         {:ok, price_point} <- persist_price_point(merchant_product, source_artifact, listing) do
      {:ok, {merchant_product, price_point}}
    end
  end

  defp upsert_listing_merchant_product(merchant_identity, product, listing) do
    attrs = merchant_product_attrs(merchant_identity, product, listing)
    changeset = MerchantProduct.changeset(%MerchantProduct{}, attrs)
    now = DateTime.utc_now()

    update_fields =
      changeset.changes
      |> Map.drop([:merchant_id, :product_id, :url])
      |> Map.to_list()

    conflict_query =
      from merchant_product in MerchantProduct,
        where:
          merchant_product.product_id == ^product.id and
            merchant_product.last_seen_at <= ^listing.observed_at,
        update: [set: ^(update_fields ++ [updated_at: now])]

    changeset
    |> Repo.insert(
      on_conflict: conflict_query,
      conflict_target: [:merchant_id, :url],
      returning: true,
      allow_stale: true
    )
    |> case do
      {:ok, %MerchantProduct{id: nil}} ->
        fetch_listing_merchant_product(
          merchant_identity.merchant_id,
          listing.listing_url,
          product
        )

      {:ok, %MerchantProduct{} = merchant_product} ->
        {:ok, merchant_product}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_listing_merchant_product(merchant_id, url, product) do
    case Repo.get_by(MerchantProduct, merchant_id: merchant_id, url: url) do
      nil ->
        {:error, :merchant_product_not_found}

      %MerchantProduct{product_id: product_id} = merchant_product when product_id != product.id ->
        {:error,
         {:merchant_product_product_conflict, merchant_product.id, product_id, product.id}}

      %MerchantProduct{} = merchant_product ->
        {:ok, merchant_product}
    end
  end

  defp persist_price_point(merchant_product, source_artifact, listing) do
    if stale_observation?(merchant_product.last_seen_at, listing.observed_at) do
      {:ok, Pricing.latest_price(merchant_product.id)}
    else
      case Pricing.latest_price(merchant_product.id) do
        %PricePoint{} = latest_price ->
          if stale_observation?(latest_price.observed_at, listing.observed_at) do
            {:ok, latest_price}
          else
            get_or_create_price_point(merchant_product, source_artifact, listing)
          end

        _latest_price ->
          get_or_create_price_point(merchant_product, source_artifact, listing)
      end
    end
  end

  defp get_or_create_price_point(merchant_product, source_artifact, listing) do
    attrs = %{
      merchant_product_id: merchant_product.id,
      observed_at: listing.observed_at,
      price: listing.amount,
      in_stock: price_point_in_stock(listing.availability),
      artifact_id: source_artifact.id
    }

    %PricePoint{}
    |> PricePoint.changeset(attrs)
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: @price_point_conflict_target,
      returning: true
    )
    |> case do
      {:ok, %PricePoint{id: nil}} ->
        fetch_price_point(merchant_product.id, listing.observed_at, source_artifact.id)

      {:ok, %PricePoint{} = price_point} ->
        case AlertEvaluationWorker.enqueue(price_point.id) do
          {:ok, _job} -> {:ok, price_point}
          {:error, reason} -> {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_price_point(merchant_product_id, observed_at, artifact_id) do
    case Repo.get_by(PricePoint,
           merchant_product_id: merchant_product_id,
           observed_at: observed_at,
           artifact_id: artifact_id
         ) do
      nil -> {:error, :price_point_not_found}
      %PricePoint{} = price_point -> {:ok, price_point}
    end
  end

  defp merchant_product_attrs(merchant_identity, product, listing) do
    %{
      merchant_id: merchant_identity.merchant_id,
      product_id: product.id,
      external_sku: listing.external_product_id,
      url: listing.listing_url,
      currency: listing.currency,
      last_seen_at: listing.observed_at,
      is_active: merchant_product_active?(listing.availability)
    }
  end

  defp stale_observation?(nil, _observed_at), do: false

  defp stale_observation?(last_seen_at, observed_at) do
    DateTime.compare(last_seen_at, observed_at) == :gt
  end

  defp merchant_product_active?(:out_of_stock), do: false
  defp merchant_product_active?(_availability), do: true

  defp price_point_in_stock(:in_stock), do: true
  defp price_point_in_stock(:out_of_stock), do: false
  defp price_point_in_stock(_availability), do: nil
end
