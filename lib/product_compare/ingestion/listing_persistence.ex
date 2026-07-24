defmodule ProductCompare.Ingestion.ListingPersistence do
  @moduledoc false

  @dialyzer {:nowarn_function, persist_listing_by_freshness: 5}

  alias ProductCompare.Ingestion.ListingPersistence.Artifacts
  alias ProductCompare.Ingestion.ListingPersistence.Enrichment
  alias ProductCompare.Ingestion.ListingPersistence.Offers
  alias ProductCompare.Ingestion.ListingPersistence.Products
  alias ProductCompare.Ingestion.MerchantIdentities
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Ingestion.Reconciliation
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  @spec persist(Source.t(), NormalizedListing.t(), keyword()) ::
          {:ok, map()} | {:error, term()}
  def persist(
        %Source{id: source_id} = source,
        %NormalizedListing{} = listing,
        opts
      ) do
    Repo.transaction(fn ->
      with {:ok, merchant_identity} <-
             MerchantIdentities.resolve_in_transaction(source_id, listing),
           {:ok, persisted_listing} <-
             persist_listing_in_transaction(source, listing, merchant_identity),
           :ok <- maybe_record_import_observation(opts, persisted_listing) do
        persisted_listing
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, persisted_listing} -> {:ok, persisted_listing}
      {:error, reason} -> {:error, reason}
    end
  end

  defp maybe_record_import_observation(opts, persisted_listing) do
    case Keyword.get(opts, :import_run) do
      %ImportRun{} = import_run -> Reconciliation.observe(import_run, persisted_listing)
      _other -> :ok
    end
  end

  defp persist_listing_in_transaction(source, listing, merchant_identity) do
    with {:ok, source_artifact} <- Artifacts.upsert_source_artifact(source, listing),
         {:ok, {freshness, external_product}} <-
           Artifacts.upsert_external_product(source, listing) do
      persist_listing_by_freshness(
        freshness,
        source_artifact,
        external_product,
        merchant_identity,
        listing
      )
    end
  end

  defp persist_listing_by_freshness(
         :fresh,
         source_artifact,
         external_product,
         merchant_identity,
         listing
       ) do
    with {:ok, product} <-
           Products.ensure_product(external_product, source_artifact, listing),
         {:ok, product, taxonomy} <-
           Enrichment.enrich_product(product, source_artifact, listing),
         {:ok, external_product} <-
           Artifacts.attach_external_product(external_product, product, listing),
         {:ok, {merchant_product, price_point}} <-
           Offers.persist_offer(merchant_identity, product, source_artifact, listing) do
      evidence = Enrichment.persist_evidence(product, source_artifact, listing)

      {:ok,
       %{
         source_artifact: source_artifact,
         external_product: external_product,
         product: product,
         merchant_identity: merchant_identity,
         merchant_product: merchant_product,
         price_point: price_point,
         media: evidence.media,
         specifications: evidence.specifications,
         taxonomy: taxonomy
       }}
    end
  end

  defp persist_listing_by_freshness(
         :stale,
         source_artifact,
         external_product,
         merchant_identity,
         _listing
       ) do
    product = Artifacts.stale_product(external_product)
    merchant_product = Artifacts.stale_merchant_product(external_product)

    {:ok,
     %{
       source_artifact: source_artifact,
       external_product: external_product,
       product: product,
       merchant_identity: merchant_identity,
       merchant_product: merchant_product,
       price_point: merchant_product && Pricing.latest_price(merchant_product.id)
     }}
  end
end
