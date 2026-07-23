defmodule ProductCompareWeb.Resolvers.Catalog.CurrentAttributes do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Specs
  alias ProductCompare.Specs.ClaimValue
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.TaxonAttribute

  @base_unit_symbol_cache_context_key :catalog_base_unit_symbol_cache_key
  @max_evidence_excerpt_length 500

  @spec current_attributes(Product.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, [map()]} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def current_attributes(
        %Product{id: product_id} = product,
        _args,
        %{context: %{loader: loader}} = resolution
      )
      when is_integer(product_id) do
    loader
    |> Dataloader.load(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
    |> Dataloader.load(Catalog, {:many, SpecificationCorrection}, product_id: product_id)
    |> load_taxon_attributes(product.primary_type_taxon_id)
    |> on_load(fn loader ->
      attributes =
        loader
        |> Dataloader.get(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
        |> Specs.with_current_attribute_metadata_from_taxon_attributes(
          loaded_taxon_attributes(loader, product.primary_type_taxon_id)
        )
        |> format_current_attributes(
          resolution,
          loader
          |> Dataloader.get(Catalog, {:many, SpecificationCorrection}, product_id: product_id)
          |> Specs.correction_counts()
        )

      {:ok, attributes}
    end)
  end

  def current_attributes(%Product{id: product_id}, _args, _resolution) do
    attributes =
      product_id
      |> Specs.list_current_attributes_for_product()
      |> format_current_attributes(nil, Specs.correction_counts_for_product(product_id))

    {:ok, attributes}
  end

  @spec clear_base_unit_symbol_cache(Absinthe.Resolution.t()) :: :ok
  def clear_base_unit_symbol_cache(resolution) do
    if cache_key = base_unit_symbol_cache_key(resolution) do
      Process.delete(cache_key)
    end

    :ok
  end

  defp load_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.load(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp load_taxon_attributes(loader, _taxon_id), do: loader

  defp loaded_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.get(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp loaded_taxon_attributes(_loader, _taxon_id), do: []

  defp format_current_attributes(current_attributes, resolution, correction_counts) do
    base_unit_symbols_by_dimension =
      current_attributes
      |> Enum.flat_map(&non_base_numeric_dimension_id/1)
      |> unit_symbols_for_dimensions(resolution)

    Enum.map(
      current_attributes,
      &format_current_attribute(&1, base_unit_symbols_by_dimension, correction_counts)
    )
  end

  defp unit_symbols_for_dimensions(dimension_ids, nil),
    do: Specs.unit_symbols_for_dimensions(dimension_ids)

  defp unit_symbols_for_dimensions(dimension_ids, resolution) do
    case base_unit_symbol_cache_key(resolution) do
      nil -> Specs.unit_symbols_for_dimensions(dimension_ids)
      cache_key -> cached_unit_symbols_for_dimensions(dimension_ids, cache_key)
    end
  end

  defp cached_unit_symbols_for_dimensions(dimension_ids, cache_key) do
    dimension_ids = Enum.uniq(dimension_ids)
    cached_symbols = Process.get(cache_key, %{})

    missing_dimension_ids =
      Enum.reject(dimension_ids, &Map.has_key?(cached_symbols, &1))

    symbols =
      case missing_dimension_ids do
        [] ->
          cached_symbols

        ids ->
          fetched_symbols = Specs.unit_symbols_for_dimensions(ids)
          loaded_symbols = Map.new(ids, &{&1, Map.get(fetched_symbols, &1)})
          updated_symbols = Map.merge(cached_symbols, loaded_symbols)

          Process.put(cache_key, updated_symbols)
          updated_symbols
      end

    Map.take(symbols, dimension_ids)
  end

  defp base_unit_symbol_cache_key(%{context: context}) when is_map(context),
    do: Map.get(context, @base_unit_symbol_cache_context_key)

  defp base_unit_symbol_cache_key(_resolution), do: nil

  defp non_base_numeric_dimension_id(%{
         attribute: %{data_type: :numeric, dimension_id: dimension_id},
         claim: %{value_num_base: %Decimal{}, unit: unit}
       })
       when is_integer(dimension_id) do
    if base_unit?(unit), do: [], else: [dimension_id]
  end

  defp non_base_numeric_dimension_id(_current_attribute), do: []

  defp format_current_attribute(
         %{attribute: attribute, claim: claim} = current_attribute,
         base_unit_symbols_by_dimension,
         correction_counts
       ) do
    taxon_attribute = Map.get(current_attribute, :taxon_attribute)

    attribute_correction_counts =
      Map.get(correction_counts, attribute.id, %{pending: 0, accepted: 0})

    %{
      attribute_id: GlobalId.encode(:attribute, attribute.id),
      code: attribute.code,
      display_name: attribute.display_name,
      data_type: Atom.to_string(attribute.data_type),
      value_text: ClaimValue.format(claim),
      sort_order: taxon_attribute && taxon_attribute.sort_order,
      group_label: taxon_attribute && taxon_attribute.compare_group_label,
      is_required: (taxon_attribute && taxon_attribute.is_required) || false,
      numeric_value: numeric_claim_value(claim),
      boolean_value: boolean_claim_value(claim),
      enum_option_id: GlobalId.encode_optional_value(:enum_option, claim.enum_option_id),
      unit_symbol: attribute_unit_symbol(attribute, claim, base_unit_symbols_by_dimension),
      claim_id: GlobalId.encode(:product_attribute_claim, claim.id),
      claim_status: Atom.to_string(claim.status),
      source_type: Atom.to_string(claim.source_type),
      confidence: claim.confidence,
      pending_correction_count: attribute_correction_counts.pending,
      accepted_correction_count: attribute_correction_counts.accepted,
      evidence: format_claim_evidence(claim.evidence_links)
    }
  end

  defp format_claim_evidence(evidence_links) when is_list(evidence_links) do
    Enum.map(evidence_links, fn evidence ->
      %{
        excerpt: bounded_evidence_excerpt(evidence.excerpt),
        source_artifact: evidence.artifact
      }
    end)
  end

  defp format_claim_evidence(_evidence_links), do: []

  defp bounded_evidence_excerpt(excerpt) when is_binary(excerpt),
    do: String.slice(excerpt, 0, @max_evidence_excerpt_length)

  defp bounded_evidence_excerpt(_excerpt), do: nil

  defp numeric_claim_value(%{value_num_base: %Decimal{} = value}), do: value
  defp numeric_claim_value(_claim), do: nil

  defp boolean_claim_value(%{value_bool: value}) when is_boolean(value), do: value
  defp boolean_claim_value(_claim), do: nil

  defp attribute_unit_symbol(
         %{data_type: :numeric, dimension_id: dimension_id},
         %{value_num_base: %Decimal{}, unit: unit},
         base_unit_symbols_by_dimension
       )
       when is_integer(dimension_id) do
    if base_unit?(unit) do
      unit_symbol(unit)
    else
      Map.get(base_unit_symbols_by_dimension, dimension_id)
    end
  end

  defp attribute_unit_symbol(%{data_type: :numeric}, %{value_num_base: %Decimal{}}, _symbols),
    do: nil

  defp attribute_unit_symbol(_attribute, claim, _symbols), do: unit_symbol(claim.unit)

  defp base_unit?(%{
         multiplier_to_base: %Decimal{} = multiplier,
         offset_to_base: %Decimal{} = offset
       }) do
    Decimal.equal?(multiplier, Decimal.new("1")) and Decimal.equal?(offset, Decimal.new("0"))
  end

  defp base_unit?(_unit), do: false

  defp unit_symbol(%{symbol: symbol}) when is_binary(symbol) and symbol != "", do: symbol
  defp unit_symbol(%{code: code}) when is_binary(code) and code != "", do: code
  defp unit_symbol(_unit), do: nil
end
