defmodule ProductCompare.Catalog.FilterMetadata do
  @moduledoc """
  Display-safe product filter metadata and facet aggregation.
  """

  import Ecto.Query

  alias ProductCompare.Catalog.FilterMetadata.Query
  alias ProductCompare.Catalog.FilterMetadata.SelectedFilters
  alias ProductCompare.Catalog.FilterMetadata.TaxonomyFacets
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  @type filter_group ::
          nil
          | :primary_type
          | :use_case
          | {:numeric, pos_integer()}
          | {:booleans, pos_integer()}
          | {:enums, pos_integer()}

  @spec metadata(map()) :: map()
  def metadata(filters) when is_map(filters) do
    taxonomy_facets = TaxonomyFacets.build(filters)

    %{
      result_count: Query.result_count(filters),
      type_options: taxonomy_facets.type_options,
      use_case_options: taxonomy_facets.use_case_options,
      numeric_filters: numeric_filters(filters),
      boolean_filters: boolean_filters(filters),
      enum_filters: enum_filters(filters)
    }
  end

  def metadata(_filters), do: metadata(%{})

  defp numeric_filters(filters) do
    attributes = Specs.list_filterable_attributes([:numeric])
    selected_filters = SelectedFilters.numeric(filters)

    ranges =
      aggregate_by_selected_attribute(
        filters,
        Enum.map(attributes, & &1.id),
        Map.keys(selected_filters),
        &numeric_ranges/3,
        :numeric
      )

    unit_symbols = Specs.unit_symbols_for_dimensions(Enum.map(attributes, & &1.dimension_id))

    Enum.map(attributes, fn attribute ->
      range = Map.get(ranges, attribute.id, empty_range())
      selected_filter = Map.get(selected_filters, attribute.id)

      if present_range?(range) or not is_nil(selected_filter) do
        %{
          attribute_id: attribute.id,
          code: attribute.code,
          display_name: attribute.display_name,
          unit_symbol: Map.get(unit_symbols, attribute.dimension_id),
          min: range.min,
          max: range.max,
          selected_min: selected_filter && Map.get(selected_filter, :min),
          selected_max: selected_filter && Map.get(selected_filter, :max)
        }
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp boolean_filters(filters) do
    attributes = Specs.list_filterable_attributes([:bool])
    selected_filters = SelectedFilters.boolean(filters)

    counts_by_attribute =
      aggregate_by_selected_attribute(
        filters,
        Enum.map(attributes, & &1.id),
        Map.keys(selected_filters),
        &boolean_counts/3,
        :booleans
      )

    Enum.map(attributes, fn attribute ->
      counts = Map.get(counts_by_attribute, attribute.id, empty_boolean_counts())
      selected_filter = Map.get(selected_filters, attribute.id)

      if counts.true_count > 0 or counts.false_count > 0 or not is_nil(selected_filter) do
        %{
          attribute_id: attribute.id,
          code: attribute.code,
          display_name: attribute.display_name,
          true_count: counts.true_count,
          false_count: counts.false_count,
          selected_value: selected_filter && Map.get(selected_filter, :value)
        }
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp enum_filters(filters) do
    attributes = Specs.list_filterable_attributes([:enum])
    selected_filters = SelectedFilters.enum(filters)

    counts_by_attribute =
      aggregate_by_selected_attribute(
        filters,
        Enum.map(attributes, & &1.id),
        Map.keys(selected_filters),
        &enum_option_counts/3,
        :enums
      )

    options_by_set = Specs.list_enum_options_for_sets(Enum.map(attributes, & &1.enum_set_id))

    Enum.map(attributes, fn attribute ->
      counts = Map.get(counts_by_attribute, attribute.id, %{})
      selected_option_ids = Map.get(selected_filters, attribute.id, MapSet.new())

      if map_size(counts) > 0 or MapSet.size(selected_option_ids) > 0 do
        %{
          attribute_id: attribute.id,
          code: attribute.code,
          display_name: attribute.display_name,
          options:
            enum_options(
              Map.get(options_by_set, attribute.enum_set_id, []),
              counts,
              selected_option_ids
            )
        }
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp aggregate_by_selected_attribute(
         filters,
         attribute_ids,
         selected_attribute_ids,
         aggregator,
         key
       ) do
    filterable_attribute_ids = MapSet.new(attribute_ids)

    selected_attribute_ids =
      selected_attribute_ids
      |> Enum.filter(&MapSet.member?(filterable_attribute_ids, &1))
      |> MapSet.new()

    unselected_attribute_ids =
      Enum.reject(attribute_ids, &MapSet.member?(selected_attribute_ids, &1))

    batched_results = aggregator.(filters, unselected_attribute_ids, nil)

    selected_attribute_ids
    |> Enum.reduce(batched_results, fn attribute_id, acc ->
      filters
      |> aggregator.([attribute_id], {key, attribute_id})
      |> Map.merge(acc, fn _key, selected_value, _existing_value -> selected_value end)
    end)
  end

  defp numeric_ranges(_filters, [], _omitted_group), do: %{}

  defp numeric_ranges(filters, attribute_ids, omitted_group) do
    filtered_query = Query.filtered_products(filters, omitted_group)

    Repo.all(
      from current in ProductAttributeCurrent,
        join: claim in ProductAttributeClaim,
        on: claim.id == current.claim_id,
        join: product in subquery(filtered_query),
        on: product.id == current.product_id,
        where: current.attribute_id in ^attribute_ids,
        where: claim.attribute_id in ^attribute_ids,
        where: claim.attribute_id == current.attribute_id,
        group_by: current.attribute_id,
        select: {current.attribute_id, min(claim.value_num_base), max(claim.value_num_base)}
    )
    |> Map.new(fn {attribute_id, min, max} -> {attribute_id, %{min: min, max: max}} end)
  end

  defp boolean_counts(_filters, [], _omitted_group), do: %{}

  defp boolean_counts(filters, attribute_ids, omitted_group) do
    filtered_query = Query.filtered_products(filters, omitted_group)

    Repo.all(
      from current in ProductAttributeCurrent,
        join: claim in ProductAttributeClaim,
        on: claim.id == current.claim_id,
        join: product in subquery(filtered_query),
        on: product.id == current.product_id,
        where: current.attribute_id in ^attribute_ids,
        where: claim.attribute_id in ^attribute_ids,
        where: claim.attribute_id == current.attribute_id,
        group_by: [current.attribute_id, claim.value_bool],
        select: {current.attribute_id, claim.value_bool, count(current.product_id)}
    )
    |> Enum.reduce(%{}, fn {attribute_id, value, count}, acc ->
      key = if value, do: :true_count, else: :false_count

      default_counts =
        %{true_count: 0, false_count: 0}
        |> Map.put(key, count)

      Map.update(acc, attribute_id, default_counts, fn counts ->
        Map.put(counts, key, count)
      end)
    end)
  end

  defp enum_option_counts(_filters, [], _omitted_group), do: %{}

  defp enum_option_counts(filters, attribute_ids, omitted_group) do
    filtered_query = Query.filtered_products(filters, omitted_group)

    Repo.all(
      from current in ProductAttributeCurrent,
        join: claim in ProductAttributeClaim,
        on: claim.id == current.claim_id,
        join: product in subquery(filtered_query),
        on: product.id == current.product_id,
        where: current.attribute_id in ^attribute_ids,
        where: claim.attribute_id in ^attribute_ids,
        where: claim.attribute_id == current.attribute_id,
        group_by: [current.attribute_id, claim.enum_option_id],
        select: {current.attribute_id, claim.enum_option_id, count(current.product_id)}
    )
    |> Enum.reduce(%{}, fn {attribute_id, enum_option_id, count}, acc ->
      Map.update(acc, attribute_id, %{enum_option_id => count}, fn counts ->
        Map.put(counts, enum_option_id, count)
      end)
    end)
  end

  defp enum_options(options, counts, selected_option_ids) do
    Enum.map(options, fn option ->
      selected = MapSet.member?(selected_option_ids, option.id)
      count = Map.get(counts, option.id, 0)

      %{
        id: option.id,
        id_type: :enum_option,
        label: option.label,
        count: count,
        selected: selected,
        disabled: disabled?(count, selected)
      }
    end)
  end

  defp empty_range, do: %{min: nil, max: nil}

  defp empty_boolean_counts, do: %{true_count: 0, false_count: 0}

  defp present_range?(%{min: nil, max: nil}), do: false
  defp present_range?(_range), do: true

  defp disabled?(0, false), do: true
  defp disabled?(_count, _selected), do: false
end
