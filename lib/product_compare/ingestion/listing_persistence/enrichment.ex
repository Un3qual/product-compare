defmodule ProductCompare.Ingestion.ListingPersistence.Enrichment do
  @moduledoc false

  @dialyzer {:nowarn_function, display_category_path: 1, persist_specifications: 3}

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.SearchDocuments
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy, as: TaxonomyContext
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Ingestion.CategoryMappingCandidate
  alias ProductCompareSchemas.Taxonomy.Taxon

  @spec enrich_product(map(), map(), map()) ::
          {:ok, map(), map()} | {:error, term()}
  def enrich_product(product, source_artifact, listing) do
    with {:ok, taxonomy_resolution} <- resolve_category_mapping(source_artifact, listing),
         {:ok, current_product} <- lock_product(product.id),
         {attrs, taxonomy_result} <-
           enrichment_changes(current_product, listing, taxonomy_resolution),
         {:ok, enriched_product} <- persist_enrichment(current_product, attrs) do
      {:ok, enriched_product, taxonomy_result}
    end
  end

  @spec persist_evidence(map(), map(), map()) :: %{
          media: term(),
          specifications: map()
        }
  def persist_evidence(product, source_artifact, listing) do
    media =
      Catalog.upsert_product_media(
        product,
        source_artifact.id,
        listing.media || [],
        listing.observed_at
      )

    %{
      media: media,
      specifications: persist_specifications(product, source_artifact, listing)
    }
  end

  defp put_present_product_field(attrs, field, incoming) when is_binary(incoming) do
    case String.trim(incoming) do
      "" -> attrs
      value -> Map.put(attrs, field, value)
    end
  end

  defp put_present_product_field(attrs, _field, _incoming), do: attrs

  defp present_product_field?(value) when is_binary(value), do: value != ""
  defp present_product_field?(_value), do: false

  defp resolve_category_mapping(_source_artifact, %{manufacturer_category_path: path})
       when path in [nil, []],
       do: {:ok, :none}

  defp resolve_category_mapping(source_artifact, listing) do
    path = listing.manufacturer_category_path

    case TaxonomyContext.resolve_type_alias_for_write(path) do
      %Taxon{} = taxon ->
        {:ok, {:mapped, taxon}}

      nil ->
        case upsert_category_mapping_candidate(
               source_artifact.source_id,
               path,
               listing.observed_at
             ) do
          {:ok, _candidate} -> {:ok, :candidate}
          {:error, _reason} -> {:ok, :candidate_rejected}
        end
    end
  end

  defp enrichment_changes(current_product, listing, taxonomy_resolution) do
    attrs =
      %{}
      |> put_present_product_field(:model_number, listing.model_number)
      |> put_present_product_field(:description, listing.description)
      |> Map.reject(fn {field, _incoming} ->
        present_product_field?(Map.fetch!(current_product, field))
      end)

    mapped_type_changes(current_product, attrs, taxonomy_resolution)
  end

  defp mapped_type_changes(_current_product, attrs, :none),
    do: {attrs, %{status: :none}}

  defp mapped_type_changes(_current_product, attrs, :candidate),
    do: {attrs, %{status: :candidate}}

  defp mapped_type_changes(_current_product, attrs, :candidate_rejected),
    do: {attrs, %{status: :candidate_rejected}}

  defp mapped_type_changes(current_product, attrs, {:mapped, taxon}) do
    current_taxon =
      Repo.one(
        from current_taxon in Taxon,
          where: current_taxon.id == ^current_product.primary_type_taxon_id,
          lock: "FOR SHARE"
      )

    if current_taxon && current_taxon.code == "ingested-product" do
      {Map.put(attrs, :primary_type_taxon_id, taxon.id), %{status: :mapped, taxon_id: taxon.id}}
    else
      {attrs, %{status: :mapped_not_applied, taxon_id: taxon.id}}
    end
  end

  defp persist_enrichment(product, attrs) when map_size(attrs) == 0, do: {:ok, product}

  defp persist_enrichment(product, attrs) do
    with {:ok, updated_product} <- product |> Product.changeset(attrs) |> Repo.update(),
         :ok <- SearchDocuments.refresh_product(updated_product.id) do
      {:ok, updated_product}
    end
  end

  defp lock_product(product_id) do
    if Repo.in_transaction?() do
      case Repo.one(
             from product in Product,
               where: product.id == ^product_id,
               lock: "FOR UPDATE"
           ) do
        nil -> {:error, :product_not_found}
        product -> {:ok, product}
      end
    else
      {:error, :transaction_required}
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
      status: :pending,
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
end
