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
    filters
    |> selected_filters_by_attribute(:numeric)
    |> metadata_for_attributes(:numeric, fn attribute, selected_filter ->
      range = numeric_range(filters, attribute.id)

      if present_range?(range) or not is_nil(selected_filter) do
        %{
          attribute_id: attribute.id,
          code: attribute.code,
          display_name: attribute.display_name,
          unit_symbol: Specs.unit_symbol_for_dimension(attribute.dimension_id),
          min: range.min,
          max: range.max,
          selected_min: selected_filter && Map.get(selected_filter, :min),
          selected_max: selected_filter && Map.get(selected_filter, :max)
        }
      end
    end)
  end

  defp boolean_filters(filters) do
    filters
    |> selected_filters_by_attribute(:booleans)
    |> metadata_for_attributes(:bool, fn attribute, selected_filter ->
      counts = boolean_counts(filters, attribute.id)

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
  end

  defp enum_filters(filters) do
    selected_filters = selected_enum_filters_by_attribute(filters)

    [:enum]
    |> Specs.list_filterable_attributes()
    |> Enum.map(fn attribute ->
      counts = enum_option_counts(filters, attribute.id)
      selected_option_ids = Map.get(selected_filters, attribute.id, MapSet.new())

      if map_size(counts) > 0 or MapSet.size(selected_option_ids) > 0 do
        %{
          attribute_id: attribute.id,
          code: attribute.code,
          display_name: attribute.display_name,
          options: enum_options(attribute.enum_set_id, counts, selected_option_ids)
        }
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp metadata_for_attributes(selected_filters, data_type, mapper) do
    [data_type]
    |> Specs.list_filterable_attributes()
    |> Enum.map(fn attribute -> mapper.(attribute, Map.get(selected_filters, attribute.id)) end)
    |> Enum.reject(&is_nil/1)
  end

  defp primary_type_counts(filters) do
    filters
    |> filtered_products_query(:primary_type)
    |> then(fn query ->
      Repo.all(
        from product in subquery(query),
          group_by: product.primary_type_taxon_id,
          select: {product.primary_type_taxon_id, count(product.id)}
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
        group_by: product_taxon.taxon_id,
        select: {product_taxon.taxon_id, count(product_taxon.product_id, :distinct)}
    )
    |> Map.new()
  end

  defp numeric_range(filters, attribute_id) do
    filtered_query = filtered_products_query(filters, {:numeric, attribute_id})

    Repo.one(
      from current in ProductAttributeCurrent,
        join: claim in ProductAttributeClaim,
        on: claim.id == current.claim_id,
        join: product in subquery(filtered_query),
        on: product.id == current.product_id,
        where: current.attribute_id == ^attribute_id,
        where: claim.attribute_id == ^attribute_id,
        select: %{min: min(claim.value_num_base), max: max(claim.value_num_base)}
    ) || %{min: nil, max: nil}
  end

  defp boolean_counts(filters, attribute_id) do
    filtered_query = filtered_products_query(filters, {:booleans, attribute_id})

    counts =
      Repo.all(
        from current in ProductAttributeCurrent,
          join: claim in ProductAttributeClaim,
          on: claim.id == current.claim_id,
          join: product in subquery(filtered_query),
          on: product.id == current.product_id,
          where: current.attribute_id == ^attribute_id,
          where: claim.attribute_id == ^attribute_id,
          group_by: claim.value_bool,
          select: {claim.value_bool, count(current.product_id)}
      )
      |> Map.new()

    %{
      true_count: Map.get(counts, true, 0),
      false_count: Map.get(counts, false, 0)
    }
  end

  defp enum_option_counts(filters, attribute_id) do
    filtered_query = filtered_products_query(filters, {:enums, attribute_id})

    Repo.all(
      from current in ProductAttributeCurrent,
        join: claim in ProductAttributeClaim,
        on: claim.id == current.claim_id,
        join: product in subquery(filtered_query),
        on: product.id == current.product_id,
        where: current.attribute_id == ^attribute_id,
        where: claim.attribute_id == ^attribute_id,
        group_by: claim.enum_option_id,
        select: {claim.enum_option_id, count(current.product_id)}
    )
    |> Map.new()
  end

  defp enum_options(enum_set_id, counts, selected_option_ids) do
    enum_set_id
    |> Specs.list_enum_options_for_set()
    |> Enum.map(fn option ->
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

  defp selected_filters_by_attribute(filters, key) do
    filters
    |> Map.get(key, [])
    |> Map.new(fn filter -> {Map.fetch!(filter, :attribute_id), filter} end)
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
