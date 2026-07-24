defmodule ProductCompare.Catalog.FilterMetadata.AttributeFacets do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.FilterMetadata.Query
  alias ProductCompare.Catalog.FilterMetadata.SelectedFilters
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  @spec build(map()) :: %{
          numeric_filters: list(),
          boolean_filters: list(),
          enum_filters: list()
        }
  def build(filters) do
    %{
      numeric_filters: numeric_filters(filters),
      boolean_filters: boolean_filters(filters),
      enum_filters: enum_filters(filters)
    }
  end

  defp numeric_filters(filters) do
    attributes = Specs.list_filterable_attributes([:numeric])
    selected_filters = SelectedFilters.numeric(filters)

    ranges =
      aggregate_by_selected_attribute(
        filters,
        Enum.map(attributes, & &1.id),
        Map.keys(selected_filters),
        &numeric_ranges/2,
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
        &boolean_counts/2,
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
        &enum_option_counts/2,
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
      |> Enum.uniq()
      |> Enum.sort()

    selected_attribute_id_set = MapSet.new(selected_attribute_ids)

    unselected_attribute_ids =
      Enum.reject(attribute_ids, &MapSet.member?(selected_attribute_id_set, &1))

    unselected_group =
      case unselected_attribute_ids do
        [] -> []
        ids -> [{ids, nil}]
      end

    selected_groups =
      Enum.map(selected_attribute_ids, &{[&1], {key, &1}})

    aggregator.(filters, unselected_group ++ selected_groups)
  end

  defp numeric_ranges(_filters, []), do: %{}

  defp numeric_ranges(filters, groups) do
    groups
    |> Enum.map(fn {attribute_ids, omitted_group} ->
      numeric_ranges_query(filters, attribute_ids, omitted_group)
    end)
    |> union_all_queries()
    |> Repo.all()
    |> Map.new(fn {attribute_id, min, max} -> {attribute_id, %{min: min, max: max}} end)
  end

  defp numeric_ranges_query(filters, attribute_ids, omitted_group) do
    filters
    |> attribute_claim_query(attribute_ids, omitted_group)
    |> group_by([current, _claim, _product], current.attribute_id)
    |> select(
      [current, claim, _product],
      {current.attribute_id, min(claim.value_num_base), max(claim.value_num_base)}
    )
  end

  defp boolean_counts(_filters, []), do: %{}

  defp boolean_counts(filters, groups) do
    groups
    |> Enum.map(fn {attribute_ids, omitted_group} ->
      boolean_counts_query(filters, attribute_ids, omitted_group)
    end)
    |> union_all_queries()
    |> Repo.all()
    |> Enum.reduce(%{}, fn {attribute_id, value, count}, acc ->
      key = if value, do: :true_count, else: :false_count
      default_counts = Map.put(%{true_count: 0, false_count: 0}, key, count)
      Map.update(acc, attribute_id, default_counts, &Map.put(&1, key, count))
    end)
  end

  defp boolean_counts_query(filters, attribute_ids, omitted_group) do
    filters
    |> attribute_claim_query(attribute_ids, omitted_group)
    |> group_by([current, claim, _product], [current.attribute_id, claim.value_bool])
    |> select(
      [current, claim, _product],
      {current.attribute_id, claim.value_bool, count(current.product_id)}
    )
  end

  defp enum_option_counts(_filters, []), do: %{}

  defp enum_option_counts(filters, groups) do
    groups
    |> Enum.map(fn {attribute_ids, omitted_group} ->
      enum_option_counts_query(filters, attribute_ids, omitted_group)
    end)
    |> union_all_queries()
    |> Repo.all()
    |> Enum.reduce(%{}, fn {attribute_id, enum_option_id, count}, acc ->
      Map.update(acc, attribute_id, %{enum_option_id => count}, fn counts ->
        Map.put(counts, enum_option_id, count)
      end)
    end)
  end

  defp enum_option_counts_query(filters, attribute_ids, omitted_group) do
    filters
    |> attribute_claim_query(attribute_ids, omitted_group)
    |> group_by([current, claim, _product], [current.attribute_id, claim.enum_option_id])
    |> select(
      [current, claim, _product],
      {current.attribute_id, claim.enum_option_id, count(current.product_id)}
    )
  end

  defp attribute_claim_query(filters, attribute_ids, omitted_group) do
    filtered_query = Query.filtered_products(filters, omitted_group)

    from current in ProductAttributeCurrent,
      join: claim in ProductAttributeClaim,
      on: claim.id == current.claim_id,
      join: product in subquery(filtered_query),
      on: product.id == current.product_id,
      where: current.attribute_id in ^attribute_ids,
      where: claim.attribute_id in ^attribute_ids,
      where: claim.attribute_id == current.attribute_id
  end

  defp union_all_queries([query | queries]) do
    Enum.reduce(queries, query, fn next_query, unioned_query ->
      union_all(unioned_query, ^next_query)
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
