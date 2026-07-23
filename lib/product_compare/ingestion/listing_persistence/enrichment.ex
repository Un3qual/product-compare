defmodule ProductCompare.Ingestion.ListingPersistence.Enrichment do
  @moduledoc false

  @dialyzer {:nowarn_function, display_category_path: 1, persist_specifications: 3}

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy, as: TaxonomyContext
  alias ProductCompareSchemas.Ingestion.CategoryMappingCandidate
  alias ProductCompareSchemas.Taxonomy.Taxon

  @spec enrich_product(map(), map(), map()) ::
          {:ok, map(), map()} | {:error, term()}
  def enrich_product(product, source_artifact, listing) do
    with {:ok, product} <- fill_missing_product_enrichment(product, listing) do
      apply_category_mapping(source_artifact, product, listing)
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
end
