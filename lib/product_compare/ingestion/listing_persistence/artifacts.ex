defmodule ProductCompare.Ingestion.ListingPersistence.Artifacts do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @source_artifact_conflict_target {:unsafe_fragment,
                                    "(source_id, content_hash) WHERE content_hash IS NOT NULL"}

  @spec upsert_source_artifact(Source.t(), map()) ::
          {:ok, SourceArtifact.t()} | {:error, term()}
  def upsert_source_artifact(%Source{id: source_id}, listing) do
    content_hash = listing_content_hash(listing)

    %SourceArtifact{}
    |> SourceArtifact.changeset(%{
      source_id: source_id,
      url: listing.listing_url,
      fetched_at: listing.observed_at,
      content_hash: content_hash,
      raw_json: listing.raw_payload
    })
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: @source_artifact_conflict_target,
      returning: true
    )
    |> case do
      {:ok, %SourceArtifact{id: nil}} -> fetch_source_artifact(source_id, content_hash)
      {:ok, %SourceArtifact{} = source_artifact} -> {:ok, source_artifact}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec upsert_external_product(Source.t(), map()) ::
          {:ok, {:fresh | :stale, ExternalProduct.t()}} | {:error, term()}
  def upsert_external_product(%Source{id: source_id}, listing) do
    attrs = external_product_attrs(source_id, listing)

    %ExternalProduct{}
    |> ExternalProduct.changeset(attrs)
    |> Repo.insert(
      on_conflict: external_product_conflict_query(attrs),
      conflict_target: [:source_id, :external_id],
      returning: true,
      allow_stale: true
    )
    |> case do
      {:ok, %ExternalProduct{id: nil}} ->
        with {:ok, external_product} <-
               fetch_external_product(source_id, listing.external_product_id) do
          {:ok, {:stale, external_product}}
        end

      {:ok, %ExternalProduct{} = external_product} ->
        {:ok, {:fresh, external_product}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @spec attach_external_product(ExternalProduct.t(), Product.t(), map()) ::
          {:ok, ExternalProduct.t()} | {:error, term()}
  def attach_external_product(external_product, product, listing) do
    query =
      from persisted_external_product in ExternalProduct,
        where:
          persisted_external_product.id == ^external_product.id and
            persisted_external_product.last_seen_at <= ^listing.observed_at,
        select: persisted_external_product

    updates = [
      product_id: product.id,
      canonical_url: listing.listing_url,
      last_seen_at: listing.observed_at
    ]

    case Repo.update_all(query, set: updates) do
      {1, [updated_external_product]} -> {:ok, updated_external_product}
      {0, []} -> fetch_external_product(external_product.id)
    end
  end

  @spec stale_product(ExternalProduct.t()) :: Product.t() | nil
  def stale_product(%ExternalProduct{product_id: nil}), do: nil

  def stale_product(%ExternalProduct{product_id: product_id}),
    do: Repo.get(Product, product_id)

  @spec stale_merchant_product(ExternalProduct.t()) :: MerchantProduct.t() | nil
  def stale_merchant_product(%ExternalProduct{
        product_id: product_id,
        canonical_url: canonical_url,
        external_id: external_id
      })
      when not is_nil(product_id) do
    MerchantProduct
    |> where(
      [merchant_product],
      merchant_product.product_id == ^product_id and merchant_product.url == ^canonical_url and
        merchant_product.external_sku == ^external_id
    )
    |> order_by([merchant_product],
      desc: merchant_product.last_seen_at,
      desc: merchant_product.id
    )
    |> limit(1)
    |> Repo.one()
  end

  def stale_merchant_product(_external_product), do: nil

  defp fetch_source_artifact(source_id, content_hash) do
    case Repo.get_by(SourceArtifact, source_id: source_id, content_hash: content_hash) do
      nil -> {:error, :source_artifact_not_found}
      %SourceArtifact{} = source_artifact -> {:ok, source_artifact}
    end
  end

  defp external_product_conflict_query(attrs) do
    from external_product in ExternalProduct,
      where: external_product.last_seen_at <= ^attrs.last_seen_at,
      update: [
        set: [
          canonical_url: ^attrs.canonical_url,
          last_seen_at: ^attrs.last_seen_at
        ]
      ]
  end

  defp fetch_external_product(source_id, external_product_id) do
    case Repo.get_by(ExternalProduct, source_id: source_id, external_id: external_product_id) do
      nil -> {:error, :external_product_not_found}
      %ExternalProduct{} = external_product -> {:ok, external_product}
    end
  end

  defp fetch_external_product(external_product_id) do
    case Repo.get(ExternalProduct, external_product_id) do
      nil -> {:error, :external_product_not_found}
      %ExternalProduct{} = external_product -> {:ok, external_product}
    end
  end

  defp external_product_attrs(source_id, listing) do
    %{
      source_id: source_id,
      external_id: listing.external_product_id,
      canonical_url: listing.listing_url,
      last_seen_at: listing.observed_at
    }
  end

  defp listing_content_hash(listing) do
    payload = [
      ["amount", canonical_hash_value(listing.amount)],
      ["availability", canonical_hash_value(listing.availability)],
      ["currency", canonical_hash_value(listing.currency)],
      ["external_product_id", canonical_hash_value(listing.external_product_id)],
      ["listing_url", canonical_hash_value(listing.listing_url)],
      ["merchant_identifier", canonical_hash_value(listing.merchant_identifier)],
      ["observed_at", canonical_hash_value(listing.observed_at)],
      ["raw_payload", canonical_hash_value(listing.raw_payload)]
    ]

    payload
    |> Jason.encode!()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end

  defp canonical_hash_value(%Decimal{} = value), do: Decimal.to_string(value, :normal)
  defp canonical_hash_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp canonical_hash_value(%NaiveDateTime{} = value), do: NaiveDateTime.to_iso8601(value)
  defp canonical_hash_value(%Date{} = value), do: Date.to_iso8601(value)
  defp canonical_hash_value(%Time{} = value), do: Time.to_iso8601(value)

  defp canonical_hash_value(value) when is_map(value) do
    value
    |> Enum.map(fn {key, value} -> [canonical_hash_key(key), canonical_hash_value(value)] end)
    |> Enum.sort_by(&List.first/1)
  end

  defp canonical_hash_value(value) when is_list(value),
    do: Enum.map(value, &canonical_hash_value/1)

  defp canonical_hash_value(value) when is_boolean(value) or is_nil(value), do: value

  defp canonical_hash_value(value)
       when is_binary(value) or is_number(value),
       do: value

  defp canonical_hash_value(value) when is_atom(value), do: Atom.to_string(value)

  defp canonical_hash_key(key) when is_binary(key), do: key
  defp canonical_hash_key(key) when is_atom(key), do: Atom.to_string(key)
  defp canonical_hash_key(key), do: inspect(key)
end
