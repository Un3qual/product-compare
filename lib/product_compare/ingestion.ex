defmodule ProductCompare.Ingestion do
  @moduledoc """
  Product data ingestion context.
  """

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy, as: TaxonomyContext
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Taxonomy.Taxon

  @source_artifact_conflict_target {:unsafe_fragment,
                                    "(source_id, content_hash) WHERE content_hash IS NOT NULL"}
  @price_point_conflict_target {:unsafe_fragment,
                                "(merchant_product_id, observed_at, artifact_id) WHERE artifact_id IS NOT NULL"}

  @spec resolve_merchant_identity(Source.t(), NormalizedListing.t()) ::
          {:ok, MerchantSourceIdentity.t()} | {:error, term()}
  def resolve_merchant_identity(%Source{id: source_id}, %NormalizedListing{} = listing) do
    case get_merchant_identity(source_id, listing.merchant_identifier) do
      nil -> create_merchant_identity(source_id, listing)
      %MerchantSourceIdentity{} = identity -> update_merchant_identity(identity, listing)
    end
  end

  @type persisted_listing :: %{
          source_artifact: SourceArtifact.t(),
          external_product: ExternalProduct.t(),
          product: Product.t(),
          merchant_identity: MerchantSourceIdentity.t(),
          merchant_product: MerchantProduct.t(),
          price_point: PricePoint.t() | nil
        }

  @spec persist_normalized_listing(Source.t(), NormalizedListing.t()) ::
          {:ok, persisted_listing()} | {:error, term()}
  def persist_normalized_listing(%Source{id: source_id} = source, %NormalizedListing{} = listing) do
    Repo.transaction(fn ->
      with {:ok, merchant_identity} <-
             resolve_merchant_identity_in_transaction(source_id, listing),
           {:ok, persisted_listing} <-
             persist_listing_in_transaction(source, listing, merchant_identity) do
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

  defp resolve_merchant_identity_in_transaction(source_id, listing) do
    case get_merchant_identity(source_id, listing.merchant_identifier) do
      nil -> create_or_fetch_merchant_identity(source_id, listing)
      %MerchantSourceIdentity{} = identity -> update_or_fetch_merchant_identity(identity, listing)
    end
  end

  defp persist_listing_in_transaction(source, listing, merchant_identity) do
    with {:ok, source_artifact} <- upsert_source_artifact(source, listing),
         {:ok, external_product} <- upsert_external_product(source, listing),
         {:ok, product} <- ensure_listing_product(external_product, listing),
         {:ok, external_product} <- attach_external_product(external_product, product, listing),
         {:ok, merchant_product} <-
           upsert_listing_merchant_product(merchant_identity, product, listing),
         {:ok, price_point} <- persist_price_point(merchant_product, source_artifact, listing) do
      {:ok,
       %{
         source_artifact: source_artifact,
         external_product: external_product,
         product: product,
         merchant_identity: merchant_identity,
         merchant_product: merchant_product,
         price_point: price_point
       }}
    end
  end

  defp upsert_source_artifact(%Source{id: source_id}, listing) do
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

  defp fetch_source_artifact(source_id, content_hash) do
    case Repo.get_by(SourceArtifact, source_id: source_id, content_hash: content_hash) do
      nil -> {:error, :source_artifact_not_found}
      %SourceArtifact{} = source_artifact -> {:ok, source_artifact}
    end
  end

  defp upsert_external_product(%Source{id: source_id}, listing) do
    case Repo.get_by(ExternalProduct,
           source_id: source_id,
           external_id: listing.external_product_id
         ) do
      nil ->
        %ExternalProduct{}
        |> ExternalProduct.changeset(external_product_attrs(source_id, listing))
        |> Repo.insert()

      %ExternalProduct{} = external_product ->
        update_external_product_if_current(external_product, listing)
    end
  end

  defp update_external_product_if_current(external_product, listing) do
    if stale_observation?(external_product.last_seen_at, listing.observed_at) do
      {:ok, external_product}
    else
      external_product
      |> ExternalProduct.changeset(%{
        canonical_url: listing.listing_url,
        last_seen_at: listing.observed_at
      })
      |> Repo.update()
    end
  end

  defp ensure_listing_product(%ExternalProduct{product_id: product_id}, listing)
       when not is_nil(product_id) do
    case Repo.get(Product, product_id) do
      nil -> get_or_create_listing_product(listing)
      %Product{} = product -> {:ok, product}
    end
  end

  defp ensure_listing_product(%ExternalProduct{}, listing),
    do: get_or_create_listing_product(listing)

  defp get_or_create_listing_product(listing) do
    slug = product_slug(listing)

    case Repo.get_by(Product, slug: slug) do
      nil -> create_listing_product(slug, listing)
      %Product{} = product -> {:ok, product}
    end
  end

  defp create_listing_product(slug, listing) do
    with {:ok, primary_type_taxon} <- ensure_ingested_type_taxon(),
         {:ok, brand_id} <- maybe_upsert_brand_id(listing.brand_name) do
      %{
        name: listing.product_title,
        slug: slug,
        brand_id: brand_id,
        primary_type_taxon_id: primary_type_taxon.id
      }
      |> Catalog.create_product()
      |> case do
        {:ok, %Product{} = product} ->
          {:ok, product}

        {:error, %Ecto.Changeset{} = changeset} ->
          if unique_error_on_field?(changeset, :slug) do
            {:ok, Repo.get_by!(Product, slug: slug)}
          else
            {:error, changeset}
          end

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp ensure_ingested_type_taxon do
    with {:ok, type_taxonomy} <- TaxonomyContext.upsert_taxonomy(%{code: "type", name: "Type"}) do
      case Repo.get_by(Taxon, taxonomy_id: type_taxonomy.id, code: "ingested-product") do
        nil ->
          create_ingested_type_taxon(type_taxonomy.id)

        %Taxon{} = taxon ->
          {:ok, taxon}
      end
    end
  end

  defp create_ingested_type_taxon(taxonomy_id) do
    %{taxonomy_id: taxonomy_id, code: "ingested-product", name: "Ingested Product"}
    |> TaxonomyContext.create_taxon()
    |> case do
      {:ok, %Taxon{} = taxon} ->
        {:ok, taxon}

      {:error, %Ecto.Changeset{} = changeset} ->
        if unique_error_on_field?(changeset, :code) do
          {:ok, Repo.get_by!(Taxon, taxonomy_id: taxonomy_id, code: "ingested-product")}
        else
          {:error, changeset}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp maybe_upsert_brand_id(nil), do: {:ok, nil}

  defp maybe_upsert_brand_id(brand_name) do
    case present_string(brand_name) do
      nil ->
        {:ok, nil}

      name ->
        case Catalog.upsert_brand(%{name: name}) do
          {:ok, brand} -> {:ok, brand.id}
          {:error, reason} -> {:error, reason}
        end
    end
  end

  defp attach_external_product(external_product, product, listing) do
    attrs =
      if stale_observation?(external_product.last_seen_at, listing.observed_at) do
        %{product_id: product.id}
      else
        %{
          product_id: product.id,
          canonical_url: listing.listing_url,
          last_seen_at: listing.observed_at
        }
      end

    external_product
    |> ExternalProduct.changeset(attrs)
    |> Repo.update()
  end

  defp upsert_listing_merchant_product(merchant_identity, product, listing) do
    attrs = merchant_product_attrs(merchant_identity, product, listing)

    case Repo.get_by(MerchantProduct,
           merchant_id: merchant_identity.merchant_id,
           url: listing.listing_url
         ) do
      nil ->
        Pricing.upsert_merchant_product(attrs)

      %MerchantProduct{} = merchant_product ->
        if stale_observation?(merchant_product.last_seen_at, listing.observed_at) do
          {:ok, merchant_product}
        else
          Pricing.upsert_merchant_product(attrs)
        end
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
        {:ok, price_point}

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

  defp create_merchant_identity(source_id, listing) do
    Repo.transaction(fn ->
      case create_or_fetch_merchant_identity(source_id, listing) do
        {:ok, identity} -> identity
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, %MerchantSourceIdentity{} = identity} ->
        {:ok, identity}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_merchant_identity_in_transaction(source_id, listing) do
    with {:ok, merchant} <- upsert_listing_merchant(listing) do
      %MerchantSourceIdentity{}
      |> MerchantSourceIdentity.changeset(identity_attrs(source_id, merchant.id, listing))
      |> Repo.insert(
        on_conflict: :nothing,
        conflict_target: [:source_id, :merchant_identifier],
        returning: true
      )
      |> maybe_update_conflicting_identity(source_id, merchant, listing)
    end
  end

  defp create_or_fetch_merchant_identity(source_id, listing) do
    case create_merchant_identity_in_transaction(source_id, listing) do
      {:ok, %MerchantSourceIdentity{} = identity} ->
        {:ok, identity}

      {:stale_conflict, ^source_id, merchant_identifier} ->
        fetch_merchant_identity(source_id, merchant_identifier)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp update_merchant_identity(identity, listing) do
    Repo.transaction(fn ->
      case update_or_fetch_merchant_identity(identity, listing) do
        {:ok, updated_identity} -> updated_identity
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, %MerchantSourceIdentity{} = updated_identity} ->
        {:ok, updated_identity}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp update_or_fetch_merchant_identity(identity, listing) do
    case update_identity_if_current(identity, listing) do
      {:ok, updated_identity} ->
        with {:ok, retargeted_identity} <- retarget_identity_merchant(updated_identity, listing) do
          preload_merchant({:ok, retargeted_identity})
        end

      :stale ->
        fetch_merchant_identity(identity.source_id, identity.merchant_identifier)
    end
  end

  defp maybe_update_conflicting_identity(
         {:ok, %MerchantSourceIdentity{id: nil}},
         source_id,
         merchant,
         listing
       ) do
    with {:ok, identity} <- fetch_merchant_identity(source_id, listing.merchant_identifier) do
      update_conflicting_merchant_identity(identity, merchant, listing)
    end
  end

  defp maybe_update_conflicting_identity(
         {:ok, %MerchantSourceIdentity{} = identity},
         _source_id,
         _merchant,
         _listing
       ) do
    preload_merchant({:ok, identity})
  end

  defp maybe_update_conflicting_identity(error, _source_id, _merchant, _listing), do: error

  defp update_conflicting_merchant_identity(identity, merchant, listing) do
    case update_identity_if_current(identity, listing, merchant.id) do
      {:ok, updated_identity} -> preload_merchant({:ok, updated_identity})
      :stale -> {:stale_conflict, identity.source_id, identity.merchant_identifier}
    end
  end

  defp fetch_merchant_identity(source_id, merchant_identifier) do
    case get_merchant_identity(source_id, merchant_identifier) do
      nil -> {:error, :merchant_identity_not_found}
      %MerchantSourceIdentity{} = identity -> {:ok, identity}
    end
  end

  defp update_identity_if_current(identity, listing, merchant_id \\ nil) do
    now = DateTime.utc_now()
    merchant_id = merchant_id || identity.merchant_id

    query =
      from source_identity in MerchantSourceIdentity,
        where:
          source_identity.id == ^identity.id and
            source_identity.last_seen_at <= ^listing.observed_at,
        select: source_identity

    updates = [
      merchant_id: merchant_id,
      merchant_name: listing.merchant_name,
      merchant_domain: listing.merchant_domain,
      last_seen_at: listing.observed_at,
      updated_at: now
    ]

    case Repo.update_all(query, set: updates) do
      {1, [updated_identity]} -> {:ok, updated_identity}
      {0, []} -> :stale
    end
  end

  defp retarget_identity_merchant(identity, listing) do
    with {:ok, merchant} <- upsert_listing_merchant(listing),
         {:ok, identity} <- set_identity_merchant(identity, merchant.id) do
      {:ok, %{identity | merchant: merchant}}
    end
  end

  defp set_identity_merchant(identity, merchant_id) do
    if identity.merchant_id == merchant_id do
      {:ok, identity}
    else
      identity
      |> MerchantSourceIdentity.changeset(%{merchant_id: merchant_id})
      |> Repo.update()
    end
  end

  defp get_merchant_identity(source_id, merchant_identifier) do
    Repo.one(
      from identity in MerchantSourceIdentity,
        where:
          identity.source_id == ^source_id and
            identity.merchant_identifier == ^merchant_identifier,
        preload: [:merchant]
    )
  end

  defp upsert_listing_merchant(listing) do
    Pricing.upsert_merchant(merchant_attrs(listing))
  end

  defp merchant_attrs(listing) do
    %{
      name:
        first_present([
          listing.merchant_name,
          listing.merchant_domain,
          listing.merchant_identifier
        ]),
      domain:
        first_present([
          listing.merchant_domain,
          domain_from_url(listing.listing_url),
          listing.merchant_identifier
        ])
    }
  end

  defp external_product_attrs(source_id, listing) do
    %{
      source_id: source_id,
      external_id: listing.external_product_id,
      canonical_url: listing.listing_url,
      last_seen_at: listing.observed_at
    }
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

  defp identity_attrs(source_id, merchant_id, listing) do
    %{
      source_id: source_id,
      merchant_id: merchant_id,
      merchant_identifier: listing.merchant_identifier,
      merchant_name: listing.merchant_name,
      merchant_domain: listing.merchant_domain,
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

  defp product_slug(listing) do
    "#{listing.product_title} #{listing.source} #{listing.external_product_id}"
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]+/, "-")
    |> String.trim("-")
    |> case do
      "" -> "ingested-product-#{listing.external_product_id}"
      slug -> slug
    end
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

  defp domain_from_url(url) when is_binary(url) do
    url
    |> URI.parse()
    |> Map.get(:host)
    |> present_string()
  end

  defp domain_from_url(_url), do: nil

  defp first_present(values), do: Enum.find_value(values, &present_string/1)

  defp present_string(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      value -> value
    end
  end

  defp present_string(_value), do: nil

  defp unique_error_on_field?(%Ecto.Changeset{errors: errors}, field) do
    Enum.any?(errors, fn
      {^field, {_message, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end

  defp preload_merchant({:ok, identity}), do: {:ok, Repo.preload(identity, :merchant)}
  defp preload_merchant(error), do: error
end
