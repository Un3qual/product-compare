defmodule ProductCompare.Specs.Reads do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Specs.Unit

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id_guard(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec get_source_artifact(term()) :: SourceArtifact.t() | nil
  def get_source_artifact(id) when valid_id_guard(id) do
    [id]
    |> get_source_artifacts()
    |> Map.fetch!(id)
  end

  def get_source_artifact(_id), do: nil

  @spec get_source_artifacts([term()]) :: %{optional(pos_integer()) => SourceArtifact.t() | nil}
  def get_source_artifacts(ids) when is_list(ids) do
    ids = ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()

    artifacts =
      case ids do
        [] ->
          %{}

        _ ->
          SourceArtifact
          |> where([artifact], artifact.id in ^ids)
          |> preload(:source)
          |> Repo.all()
          |> Map.new(&{&1.id, &1})
      end

    Map.new(ids, &{&1, Map.get(artifacts, &1)})
  end

  @spec list_current_attributes_for_products([pos_integer()]) :: %{
          optional(pos_integer()) => [map()]
        }
  def list_current_attributes_for_products(product_ids) when is_list(product_ids) do
    product_ids = normalize_ids(product_ids)

    if product_ids == [] do
      %{}
    else
      products_by_id =
        Product
        |> where([product], product.id in ^product_ids)
        |> select([product], {product.id, product.primary_type_taxon_id})
        |> Repo.all()
        |> Map.new()

      current_attributes_by_product =
        product_ids
        |> current_attributes_query()
        |> Repo.all()
        |> Enum.group_by(& &1.product_id)

      taxon_attributes_by_taxon_id =
        current_attributes_by_product
        |> Map.values()
        |> List.flatten()
        |> Enum.map(& &1.attribute_id)
        |> taxon_attributes_by_taxon_and_attribute_ids(
          for {_product_id, taxon_id} <- products_by_id,
              valid_id?(taxon_id),
              do: taxon_id
        )

      Map.new(product_ids, fn product_id ->
        current_attributes = Map.get(current_attributes_by_product, product_id, [])
        taxon_id = Map.get(products_by_id, product_id)

        taxon_attributes =
          taxon_attributes_by_taxon_id
          |> Map.get(taxon_id, [])

        {product_id,
         with_current_attribute_metadata_from_taxon_attributes(
           current_attributes,
           taxon_attributes
         )}
      end)
    end
  end

  @spec list_current_attributes_for_product(term()) :: [map()]
  def list_current_attributes_for_product(product_id) when valid_id_guard(product_id) do
    list_current_attributes_for_products([product_id])
    |> Map.fetch!(product_id)
  end

  def list_current_attributes_for_product(_product_id), do: []

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  def with_current_attribute_metadata(current_attributes, taxon_id)
      when is_list(current_attributes) do
    taxon_attributes =
      current_attributes
      |> Enum.map(& &1.attribute_id)
      |> taxon_attribute_metadata_by_attribute_id(taxon_id)
      |> Map.values()

    with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
  end

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  def list_filterable_attributes(data_types) when is_list(data_types) do
    Repo.all(
      from attribute in Attribute,
        where: attribute.is_filterable == true,
        where: attribute.data_type in ^data_types,
        order_by: [asc: attribute.display_name, asc: attribute.code, asc: attribute.id]
    )
  end

  @spec filterable_attribute_types(term()) :: %{pos_integer() => atom()}
  def filterable_attribute_types(attribute_ids) when is_list(attribute_ids) do
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

  def filterable_attribute_types(_attribute_ids), do: %{}

  @spec get_filterable_attribute(term(), term()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type)
      when valid_id_guard(attribute_id) and is_atom(data_type) do
    Repo.one(
      from attribute in Attribute,
        where: attribute.id == ^attribute_id,
        where: attribute.data_type == ^data_type,
        where: attribute.is_filterable == true
    )
  end

  def get_filterable_attribute(_attribute_id, _data_type), do: nil

  @spec filterable_enum_option_pairs(term(), term()) :: MapSet.t()
  def filterable_enum_option_pairs(attribute_ids, enum_option_ids)
      when is_list(attribute_ids) and is_list(enum_option_ids) do
    attribute_ids = normalize_ids(attribute_ids)
    enum_option_ids = normalize_ids(enum_option_ids)

    if attribute_ids == [] or enum_option_ids == [] do
      Enum.into([], MapSet.new())
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
      |> Enum.into(MapSet.new())
    end
  end

  def filterable_enum_option_pairs(_attribute_ids, _enum_option_ids),
    do: Enum.into([], MapSet.new())

  @spec enum_option_belongs_to_attribute?(term(), term()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
      when valid_id_guard(attribute_id) and valid_id_guard(enum_option_id) do
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

  def enum_option_belongs_to_attribute?(_attribute_id, _enum_option_id), do: false

  @spec list_enum_options_for_set(term()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) when valid_id_guard(enum_set_id) do
    Repo.all(
      from enum_option in EnumOption,
        where: enum_option.enum_set_id == ^enum_set_id,
        order_by: [asc: enum_option.sort_order, asc: enum_option.label, asc: enum_option.id]
    )
  end

  def list_enum_options_for_set(_enum_set_id), do: []

  @spec list_enum_options_for_sets(term()) :: %{pos_integer() => [EnumOption.t()]}
  def list_enum_options_for_sets(enum_set_ids) when is_list(enum_set_ids) do
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

  def list_enum_options_for_sets(_enum_set_ids), do: %{}

  @spec unit_symbol_for_dimension(term()) :: String.t() | nil
  def unit_symbol_for_dimension(nil), do: nil

  def unit_symbol_for_dimension(dimension_id) when valid_id_guard(dimension_id) do
    dimension_id
    |> List.wrap()
    |> unit_symbols_for_dimensions()
    |> Map.get(dimension_id)
  end

  def unit_symbol_for_dimension(_dimension_id), do: nil

  @spec unit_symbols_for_dimensions(term()) :: %{pos_integer() => String.t()}
  def unit_symbols_for_dimensions(dimension_ids) when is_list(dimension_ids) do
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

  def unit_symbols_for_dimensions(_dimension_ids), do: %{}

  @spec with_current_attribute_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  def with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
      when is_list(current_attributes) do
    attribute_ids = MapSet.new(current_attributes, & &1.attribute_id)

    taxon_attributes =
      taxon_attributes
      |> List.wrap()
      |> Enum.filter(&MapSet.member?(attribute_ids, &1.attribute_id))
      |> Map.new(&{&1.attribute_id, &1})

    current_attributes
    |> Enum.map(fn current_attribute ->
      %{
        current: current_attribute,
        attribute: current_attribute.attribute,
        claim: current_attribute.claim,
        taxon_attribute: Map.get(taxon_attributes, current_attribute.attribute_id)
      }
    end)
    |> Enum.sort_by(&current_attribute_sort_key/1)
  end

  defp current_attributes_query(product_ids) do
    ProductAttributeCurrent
    |> where([current], current.product_id in ^product_ids)
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([current, attribute],
      asc: current.product_id,
      asc: attribute.display_name,
      asc: attribute.code
    )
    |> preload([_current, attribute],
      attribute: attribute,
      claim: [:unit, :enum_option, evidence_links: [artifact: :source]]
    )
  end

  defp taxon_attributes_by_taxon_and_attribute_ids(_attribute_ids, []), do: %{}

  defp taxon_attributes_by_taxon_and_attribute_ids([], _taxon_ids), do: %{}

  defp taxon_attributes_by_taxon_and_attribute_ids(attribute_ids, taxon_ids) do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id in ^taxon_ids)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Enum.group_by(& &1.taxon_id)
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, nil), do: %{}

  defp taxon_attribute_metadata_by_attribute_id([], _taxon_id), do: %{}

  defp taxon_attribute_metadata_by_attribute_id(attribute_ids, taxon_id)
       when valid_id_guard(taxon_id) do
    TaxonAttribute
    |> where([taxon_attribute], taxon_attribute.taxon_id == ^taxon_id)
    |> where([taxon_attribute], taxon_attribute.attribute_id in ^attribute_ids)
    |> Repo.all()
    |> Map.new(&{&1.attribute_id, &1})
  end

  defp taxon_attribute_metadata_by_attribute_id(_attribute_ids, _taxon_id), do: %{}

  defp normalize_ids(ids) do
    ids
    |> Enum.filter(&valid_id?/1)
    |> Enum.uniq()
  end

  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id

  defp current_attribute_sort_key(%{attribute: attribute, taxon_attribute: taxon_attribute}) do
    sort_order = taxon_attribute && taxon_attribute.sort_order

    {
      if(is_integer(sort_order), do: 0, else: 1),
      sort_order || 0,
      String.downcase(attribute.display_name || ""),
      attribute.code || ""
    }
  end
end
