defmodule ProductCompare.Ingestion.ListingPersistence do
  @moduledoc false

  @dialyzer {:nowarn_function,
             display_category_path: 1,
             persist_listing_by_freshness: 5,
             persist_specifications: 3,
             present_string: 1}

  import Ecto.Query

  alias ProductCompare.ChangesetErrors
  alias ProductCompare.Catalog
  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Catalog.GTIN
  alias ProductCompare.Ingestion.ListingPersistence.Artifacts
  alias ProductCompare.Ingestion.MerchantIdentities
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Ingestion.Reconciliation
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy, as: TaxonomyContext
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.CategoryMappingCandidate
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Taxonomy.Taxon

  @price_point_conflict_target {:unsafe_fragment,
                                "(merchant_product_id, observed_at, artifact_id) WHERE artifact_id IS NOT NULL"}

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
           ensure_listing_product(external_product, source_artifact, listing),
         {:ok, product} <- fill_missing_product_enrichment(product, listing),
         {:ok, product, taxonomy} <- apply_category_mapping(source_artifact, product, listing),
         {:ok, external_product} <-
           Artifacts.attach_external_product(external_product, product, listing),
         {:ok, merchant_product} <-
           upsert_listing_merchant_product(merchant_identity, product, listing),
         {:ok, price_point} <- persist_price_point(merchant_product, source_artifact, listing) do
      media =
        Catalog.upsert_product_media(
          product,
          source_artifact.id,
          listing.media || [],
          listing.observed_at
        )

      specifications = persist_specifications(product, source_artifact, listing)

      {:ok,
       %{
         source_artifact: source_artifact,
         external_product: external_product,
         product: product,
         merchant_identity: merchant_identity,
         merchant_product: merchant_product,
         price_point: price_point,
         media: media,
         specifications: specifications,
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

  defp fill_missing_product_enrichment(product, listing) do
    attrs =
      %{}
      |> put_missing_product_field(:model_number, product.model_number, listing.model_number)
      |> put_missing_product_field(:description, product.description, listing.description)

    case map_size(attrs) do
      0 -> {:ok, product}
      _count -> Catalog.update_product(product, attrs)
    end
  end

  defp put_missing_product_field(attrs, _field, current, _incoming)
       when is_binary(current) and current != "",
       do: attrs

  defp put_missing_product_field(attrs, field, _current, incoming) when is_binary(incoming) do
    case String.trim(incoming) do
      "" -> attrs
      value -> Map.put(attrs, field, value)
    end
  end

  defp put_missing_product_field(attrs, _field, _current, _incoming), do: attrs

  defp apply_category_mapping(_source_artifact, product, %{manufacturer_category_path: path})
       when path in [nil, []],
       do: {:ok, product, %{status: :none}}

  defp apply_category_mapping(source_artifact, product, listing) do
    path = listing.manufacturer_category_path

    case TaxonomyContext.resolve_type_alias(path) do
      %Taxon{} = taxon ->
        maybe_assign_mapped_type(product, taxon)

      nil ->
        case upsert_category_mapping_candidate(
               source_artifact.source_id,
               path,
               listing.observed_at
             ) do
          {:ok, _candidate} -> {:ok, product, %{status: :candidate}}
          {:error, _reason} -> {:ok, product, %{status: :candidate_rejected}}
        end
    end
  end

  defp maybe_assign_mapped_type(product, taxon) do
    current_taxon = Repo.get(Taxon, product.primary_type_taxon_id)

    if current_taxon && current_taxon.code == "ingested-product" do
      case Catalog.update_product(product, %{primary_type_taxon_id: taxon.id}) do
        {:ok, updated_product} ->
          {:ok, updated_product, %{status: :mapped, taxon_id: taxon.id}}

        {:error, reason} ->
          {:error, reason}
      end
    else
      {:ok, product, %{status: :mapped_not_applied, taxon_id: taxon.id}}
    end
  end

  defp upsert_category_mapping_candidate(source_id, path, observed_at) do
    normalized_path = TaxonomyContext.normalize_category_path(path)
    display_path = display_category_path(path)
    now = DateTime.utc_now()

    attrs = %{
      source_id: source_id,
      display_path: display_path,
      normalized_path: normalized_path,
      status: "pending",
      observation_count: 1,
      last_seen_at: observed_at
    }

    conflict_query =
      from candidate in CategoryMappingCandidate,
        update: [
          set: [display_path: ^display_path, last_seen_at: ^observed_at, updated_at: ^now],
          inc: [observation_count: 1]
        ]

    %CategoryMappingCandidate{}
    |> CategoryMappingCandidate.changeset(attrs)
    |> Repo.insert(
      on_conflict: conflict_query,
      conflict_target: [:source_id, :normalized_path],
      returning: true
    )
  end

  defp display_category_path(path) when is_binary(path) do
    path
    |> String.split(">", trim: true)
    |> display_category_path()
  end

  defp display_category_path(path) when is_list(path) do
    path
    |> Enum.filter(&is_binary/1)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.join(" > ")
  end

  defp persist_specifications(product, source_artifact, listing) do
    Enum.reduce(
      listing.specifications || [],
      %{accepted: 0, persisted: 0, rejected: 0, replayed: 0},
      fn observation, result ->
        case Specs.import_observation(
               product.id,
               source_artifact.id,
               to_string(listing.source),
               observation
             ) do
          {:ok, %{accepted: accepted, replayed: replayed}} ->
            result
            |> Map.update!(if(replayed, do: :replayed, else: :persisted), &(&1 + 1))
            |> maybe_increment_accepted(accepted)

          {:error, _reason} ->
            Map.update!(result, :rejected, &(&1 + 1))
        end
      end
    )
  end

  defp maybe_increment_accepted(result, true), do: Map.update!(result, :accepted, &(&1 + 1))
  defp maybe_increment_accepted(result, false), do: result

  defp ensure_listing_product(
         %ExternalProduct{product_id: product_id},
         source_artifact,
         listing
       )
       when not is_nil(product_id) do
    case Repo.get(Product, product_id) do
      nil ->
        get_or_create_listing_product(source_artifact, listing)

      %Product{} = product ->
        preserve_external_product_identity(product, source_artifact, listing)
    end
  end

  defp ensure_listing_product(%ExternalProduct{}, source_artifact, listing),
    do: get_or_create_listing_product(source_artifact, listing)

  defp get_or_create_listing_product(source_artifact, listing) do
    case GTIN.normalize(listing.gtin) do
      {:ok, normalized_gtin} ->
        get_or_create_listing_product_by_gtin(normalized_gtin, source_artifact, listing)

      {:error, :invalid_gtin} ->
        listing
        |> get_or_create_listing_product_by_slug()
        |> drop_created_marker()
    end
  end

  defp get_or_create_listing_product_by_gtin(normalized_gtin, source_artifact, listing) do
    case Catalog.get_product_by_identifier("gtin", normalized_gtin) do
      %Product{} = product ->
        {:ok, product}

      nil ->
        with {:ok, product, created?} <- get_or_create_listing_product_by_slug(listing) do
          attach_gtin_to_new_product(
            product,
            created?,
            normalized_gtin,
            source_artifact,
            listing
          )
        end
    end
  end

  defp get_or_create_listing_product_by_slug(listing) do
    slug = product_slug(listing)

    case Catalog.get_product_by_slug(slug) do
      nil -> create_listing_product(slug, listing)
      %Product{} = product -> {:ok, product, false}
    end
  end

  defp create_listing_product(slug, listing) do
    with {:ok, primary_type_taxon} <- ensure_ingested_type_taxon(),
         {:ok, brand_id} <- maybe_upsert_brand_id(listing.brand_name) do
      %{
        name: listing.product_title,
        model_number: listing.model_number,
        description: listing.description,
        slug: slug,
        brand_id: brand_id,
        primary_type_taxon_id: primary_type_taxon.id
      }
      |> Catalog.create_product()
      |> case do
        {:ok, %Product{} = product} ->
          {:ok, product, true}

        {:error, %Ecto.Changeset{} = changeset} ->
          if ChangesetErrors.unique_error_on_field?(changeset, :slug) do
            {:ok, Repo.get_by!(Product, slug: slug), false}
          else
            {:error, changeset}
          end

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp drop_created_marker({:ok, product, _created?}), do: {:ok, product}
  defp drop_created_marker({:error, _reason} = error), do: error

  defp attach_gtin_to_new_product(
         product,
         created?,
         normalized_gtin,
         source_artifact,
         listing
       ) do
    attrs =
      validated_gtin_attrs(product, normalized_gtin, source_artifact, listing)

    case Catalog.create_product_identifier(attrs) do
      {:ok, %ProductIdentifier{}} ->
        {:ok, product}

      {:error, %Ecto.Changeset{} = changeset} ->
        resolve_identifier_insert_error(
          changeset,
          product,
          created?,
          normalized_gtin
        )
    end
  end

  defp resolve_identifier_insert_error(changeset, product, created?, normalized_gtin) do
    if ChangesetErrors.unique_error_on_any_field?(changeset, [:scheme, :normalized_value]) do
      winner = Catalog.get_product_by_identifier("gtin", normalized_gtin)

      if (created? and winner) && winner.id != product.id do
        {:ok, _deleted_product} = Repo.delete(product)
      end

      case winner do
        %Product{} -> {:ok, winner}
        nil -> {:error, changeset}
      end
    else
      {:error, changeset}
    end
  end

  defp preserve_external_product_identity(product, source_artifact, listing) do
    case {Catalog.list_product_identifiers(product.id, "gtin"), GTIN.normalize(listing.gtin)} do
      {[], {:ok, normalized_gtin}} ->
        maybe_attach_gtin_to_existing_product(
          product,
          normalized_gtin,
          source_artifact,
          listing
        )

      _existing_or_invalid ->
        {:ok, product}
    end
  end

  defp maybe_attach_gtin_to_existing_product(product, normalized_gtin, source_artifact, listing) do
    product
    |> validated_gtin_attrs(normalized_gtin, source_artifact, listing)
    |> Catalog.create_product_identifier()
    |> case do
      {:ok, %ProductIdentifier{}} ->
        {:ok, product}

      {:error, %Ecto.Changeset{} = changeset} ->
        if ChangesetErrors.unique_error_on_any_field?(changeset, [:scheme, :normalized_value]) do
          {:ok, product}
        else
          {:error, changeset}
        end
    end
  end

  defp validated_gtin_attrs(product, normalized_gtin, source_artifact, listing) do
    %{
      product_id: product.id,
      scheme: "gtin",
      normalized_value: normalized_gtin,
      display_value: listing.gtin,
      verification_status: "validated",
      source_artifact_id: source_artifact.id,
      verified_at: listing.observed_at
    }
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
        if ChangesetErrors.unique_error_on_any_field?(changeset, [:taxonomy_id, :code]) do
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

  defp present_string(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      value -> value
    end
  end

  defp present_string(_value), do: nil
end
