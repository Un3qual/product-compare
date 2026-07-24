defmodule ProductCompare.Specs.Reads.ReferenceData do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.Unit

  @max_bigint_id 9_223_372_036_854_775_807

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  def list_filterable_attributes(data_types) do
    Repo.all(
      from attribute in Attribute,
        where: attribute.is_filterable == true,
        where: attribute.data_type in ^data_types,
        order_by: [asc: attribute.display_name, asc: attribute.code, asc: attribute.id]
    )
  end

  @spec filterable_attribute_types([term()]) :: %{pos_integer() => atom()}
  def filterable_attribute_types(attribute_ids) do
    attribute_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from attribute in Attribute,
            where: attribute.id in ^ids,
            where: attribute.is_filterable == true,
            select: {attribute.id, attribute.data_type}
        )
        |> Map.new()
    end
  end

  @spec get_filterable_attribute(pos_integer(), atom()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type) do
    Repo.one(
      from attribute in Attribute,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == ^data_type,
        where: attribute.is_filterable == true
    )
  end

  @spec filterable_enum_option_pairs([term()], [term()]) :: MapSet.t()
  def filterable_enum_option_pairs(attribute_ids, enum_option_ids) do
    attribute_ids = normalize_ids(attribute_ids)
    enum_option_ids = normalize_ids(enum_option_ids)

    if attribute_ids == [] or enum_option_ids == [] do
      MapSet.new()
    else
      Repo.all(
        from attribute in Attribute,
          join: enum_option in EnumOption,
          on: enum_option.enum_set_id == attribute.enum_set_id,
          where: attribute.id in ^attribute_ids,
          where: attribute.data_type == :enum,
          where: attribute.is_filterable == true,
          where: enum_option.id in ^enum_option_ids,
          select: {attribute.id, enum_option.id}
      )
      |> map_set()
    end
  end

  @spec enum_option_belongs_to_attribute?(pos_integer(), pos_integer()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id) do
    Repo.exists?(
      from attribute in Attribute,
        join: enum_option in EnumOption,
        on: enum_option.enum_set_id == attribute.enum_set_id,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == :enum,
        where: attribute.is_filterable == true,
        where: enum_option.id == ^enum_option_id
    )
  end

  @spec list_enum_options_for_set(pos_integer()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) do
    Repo.all(
      from enum_option in EnumOption,
        where: enum_option.enum_set_id == ^enum_set_id,
        order_by: [asc: enum_option.sort_order, asc: enum_option.label, asc: enum_option.id]
    )
  end

  @spec list_enum_options_for_sets([term()]) :: %{pos_integer() => [EnumOption.t()]}
  def list_enum_options_for_sets(enum_set_ids) do
    enum_set_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from enum_option in EnumOption,
            where: enum_option.enum_set_id in ^ids,
            order_by: [
              asc: enum_option.enum_set_id,
              asc: enum_option.sort_order,
              asc: enum_option.label,
              asc: enum_option.id
            ]
        )
        |> Enum.group_by(& &1.enum_set_id)
    end
  end

  @spec unit_symbol_for_dimension(pos_integer()) :: String.t() | nil
  def unit_symbol_for_dimension(dimension_id) do
    dimension_id
    |> List.wrap()
    |> unit_symbols_for_dimensions()
    |> Map.get(dimension_id)
  end

  @spec unit_symbols_for_dimensions([term()]) :: %{pos_integer() => String.t()}
  def unit_symbols_for_dimensions(dimension_ids) do
    dimension_ids
    |> normalize_ids()
    |> case do
      [] ->
        %{}

      ids ->
        Repo.all(
          from unit in Unit,
            where: unit.dimension_id in ^ids,
            order_by: [
              asc: unit.dimension_id,
              asc:
                fragment(
                  "CASE WHEN ? = 1 AND ? = 0 THEN 0 ELSE 1 END",
                  unit.multiplier_to_base,
                  unit.offset_to_base
                ),
              asc: unit.id
            ],
            select: {
              unit.dimension_id,
              fragment("COALESCE(NULLIF(?, ''), NULLIF(?, ''))", unit.symbol, unit.code)
            }
        )
        |> Enum.reduce(%{}, fn {dimension_id, symbol}, acc ->
          Map.put_new(acc, dimension_id, symbol)
        end)
    end
  end

  defp normalize_ids(ids), do: ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id
  defp map_set(values), do: Enum.reduce(values, MapSet.new(), &MapSet.put(&2, &1))
end
