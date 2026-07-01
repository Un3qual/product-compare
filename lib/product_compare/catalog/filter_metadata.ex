defmodule ProductCompare.Catalog.FilterMetadata do
  @moduledoc """
  Display-safe product filter metadata and facet aggregation.
  """

  import Ecto.Query

  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Taxonomy.ProductTaxon
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.TaxonClosure
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @type filter_group ::
          nil
          | :primary_type
          | :use_case
          | {:numeric, pos_integer()}
          | {:booleans, pos_integer()}
          | {:enums, pos_integer()}

  @spec metadata(map()) :: map()
  def metadata(filters) when is_map(filters) do
    %{
      result_count: result_count(filters),
      type_options: type_options(filters),
      use_case_options: use_case_options(filters),
      numeric_filters: numeric_filters(filters),
      boolean_filters: boolean_filters(filters),
      enum_filters: enum_filters(filters)
    }
  end

  def metadata(_filters), do: metadata(%{})

  defp result_count(filters) do
    filters
    |> filtered_products_query()
    |> Repo.aggregate(:count, :id)
  end

  defp type_options(filters) do
    selected_id = Map.get(filters, :primary_type_taxon_id)
    counts = primary_type_counts(filters)

    "type"
    |> Taxonomy.list_taxons_for_taxonomy()
    |> Enum.map(fn taxon ->
      selected = taxon.id == selected_id
      count = Map.get(counts, taxon.id, 0)

      %{
        id: taxon.id,
        id_type: :taxon,
        label: taxon.name,
        count: count,
        selected: selected,
        disabled: disabled?(count, selected)
      }
    end)
  end

  defp use_case_options(filters) do
    selected_ids = filters |> Map.get(:use_case_taxon_ids, []) |> MapSet.new()
    counts = use_case_counts(filters)

    "use_case"
    |> Taxonomy.list_taxons_for_taxonomy()
    |> Enum.map(fn taxon ->
      selected = MapSet.member?(selected_ids, taxon.id)
      count = Map.get(counts, taxon.id, 0)

      %{
        id: taxon.id,
        id_type: :taxon,
        label: taxon.name,
        count: count,
        selected: selected,
        disabled: disabled?(count, selected)
      }
    end)
  end

  defp numeric_filters(filters) do
    attributes = Specs.list_filterable_attributes([:numeric])
    selected_filters = selected_numeric_filters_by_attribute(filters)

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
    selected_filters = selected_boolean_filters_by_attribute(filters)

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
    selected_filters = selected_enum_filters_by_attribute(filters)

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

  defp primary_type_counts(filters) do
    filters
    |> filtered_products_query(:primary_type)
    |> then(fn query ->
      Repo.all(
        from product in subquery(query),
          join: closure in TaxonClosure,
          on: closure.descendant_id == product.primary_type_taxon_id,
          group_by: closure.ancestor_id,
          select: {closure.ancestor_id, count(product.id, :distinct)}
      )
    end)
    |> Map.new()
  end

  defp use_case_counts(filters) do
    filtered_query = filtered_products_query(filters, :use_case)

    Repo.all(
      from product_taxon in ProductTaxon,
        join: product in subquery(filtered_query),
        on: product.id == product_taxon.product_id,
        join: taxon in Taxon,
        on: taxon.id == product_taxon.taxon_id,
        join: taxonomy in TaxonomySchema,
        on: taxonomy.id == taxon.taxonomy_id,
        join: closure in TaxonClosure,
        on: closure.descendant_id == product_taxon.taxon_id,
        where: taxonomy.code == "use_case",
        group_by: closure.ancestor_id,
        select: {closure.ancestor_id, count(product_taxon.product_id, :distinct)}
    )
    |> Map.new()
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
    filtered_query = filtered_products_query(filters, omitted_group)

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
    filtered_query = filtered_products_query(filters, omitted_group)

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
    filtered_query = filtered_products_query(filters, omitted_group)

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

  defp selected_numeric_filters_by_attribute(filters) do
    filters
    |> Map.get(:numeric, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      attribute_id = Map.fetch!(filter, :attribute_id)
      Map.update(acc, attribute_id, filter, &merge_numeric_filters(&1, filter))
    end)
  end

  defp selected_boolean_filters_by_attribute(filters) do
    filters
    |> Map.get(:booleans, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      attribute_id = Map.fetch!(filter, :attribute_id)
      Map.update(acc, attribute_id, filter, &merge_boolean_filters(&1, filter))
    end)
  end

  defp merge_numeric_filters(existing_filter, next_filter) do
    %{
      attribute_id: Map.fetch!(existing_filter, :attribute_id),
      min: merge_numeric_min(Map.get(existing_filter, :min), Map.get(next_filter, :min)),
      max: merge_numeric_max(Map.get(existing_filter, :max), Map.get(next_filter, :max))
    }
  end

  defp merge_numeric_min(nil, value), do: value
  defp merge_numeric_min(value, nil), do: value

  defp merge_numeric_min(existing_value, next_value) do
    case Decimal.compare(to_decimal(existing_value), to_decimal(next_value)) do
      :lt -> next_value
      _comparison -> existing_value
    end
  end

  defp merge_numeric_max(nil, value), do: value
  defp merge_numeric_max(value, nil), do: value

  defp merge_numeric_max(existing_value, next_value) do
    case Decimal.compare(to_decimal(existing_value), to_decimal(next_value)) do
      :gt -> next_value
      _comparison -> existing_value
    end
  end

  defp to_decimal(%Decimal{} = value), do: value
  defp to_decimal(value) when is_integer(value), do: Decimal.new(value)
  defp to_decimal(value) when is_float(value), do: Decimal.from_float(value)
  defp to_decimal(value) when is_binary(value), do: Decimal.new(value)

  defp merge_boolean_filters(existing_filter, next_filter) do
    existing_value = Map.get(existing_filter, :value)
    next_value = Map.get(next_filter, :value)

    cond do
      is_nil(existing_value) ->
        existing_filter

      existing_value == next_value ->
        existing_filter

      true ->
        %{attribute_id: Map.fetch!(existing_filter, :attribute_id), value: nil}
    end
  end

  defp selected_enum_filters_by_attribute(filters) do
    filters
    |> Map.get(:enums, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      Map.update(
        acc,
        Map.fetch!(filter, :attribute_id),
        MapSet.new([Map.fetch!(filter, :enum_option_id)]),
        &MapSet.put(&1, Map.fetch!(filter, :enum_option_id))
      )
    end)
  end

  defp empty_range, do: %{min: nil, max: nil}

  defp empty_boolean_counts, do: %{true_count: 0, false_count: 0}

  defp filtered_products_query(filters, omitted_group \\ nil) do
    Product
    |> Filtering.apply_filters_except(filters, omitted_group)
    |> exclude(:order_by)
  end

  defp present_range?(%{min: nil, max: nil}), do: false
  defp present_range?(_range), do: true

  defp disabled?(0, false), do: true
  defp disabled?(_count, _selected), do: false
end
