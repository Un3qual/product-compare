defmodule ProductCompare.Ingestion.ListingPersistence.Products do
  @moduledoc false

  @dialyzer {:nowarn_function, present_string: 1}

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.GTIN
  alias ProductCompare.ChangesetErrors
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy, as: TaxonomyContext
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Taxonomy.Taxon

  @spec ensure_product(ExternalProduct.t(), map(), map()) ::
          {:ok, Product.t()} | {:error, term()}
  def ensure_product(
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

  def ensure_product(%ExternalProduct{}, source_artifact, listing),
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
