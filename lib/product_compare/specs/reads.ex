defmodule ProductCompare.Specs.Reads do
  @moduledoc false

  alias ProductCompare.Specs.Reads.Artifacts
  alias ProductCompare.Specs.Reads.CurrentAttributes
  alias ProductCompare.Specs.Reads.ReferenceData
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.TaxonAttribute

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id_guard(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec get_source_artifact(term()) :: SourceArtifact.t() | nil
  def get_source_artifact(id) when valid_id_guard(id), do: Artifacts.get(id)
  def get_source_artifact(_id), do: nil

  @spec get_source_artifacts([term()]) :: %{optional(pos_integer()) => SourceArtifact.t() | nil}
  def get_source_artifacts(ids) when is_list(ids), do: Artifacts.get_many(ids)

  @spec list_current_attributes_for_products([pos_integer()]) :: %{
          optional(pos_integer()) => [map()]
        }
  def list_current_attributes_for_products(product_ids) when is_list(product_ids),
    do: CurrentAttributes.for_products(product_ids)

  @spec list_current_attributes_for_product(term()) :: [map()]
  def list_current_attributes_for_product(product_id) when valid_id_guard(product_id),
    do: CurrentAttributes.for_product(product_id)

  def list_current_attributes_for_product(_product_id), do: []

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  def with_current_attribute_metadata(current_attributes, taxon_id)
      when is_list(current_attributes),
      do: CurrentAttributes.with_metadata(current_attributes, taxon_id)

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  def list_filterable_attributes(data_types) when is_list(data_types),
    do: ReferenceData.list_filterable_attributes(data_types)

  @spec filterable_attribute_types(term()) :: %{pos_integer() => atom()}
  def filterable_attribute_types(attribute_ids) when is_list(attribute_ids),
    do: ReferenceData.filterable_attribute_types(attribute_ids)

  def filterable_attribute_types(_attribute_ids), do: %{}

  @spec get_filterable_attribute(term(), term()) :: Attribute.t() | nil
  def get_filterable_attribute(attribute_id, data_type)
      when valid_id_guard(attribute_id) and is_atom(data_type),
      do: ReferenceData.get_filterable_attribute(attribute_id, data_type)

  def get_filterable_attribute(_attribute_id, _data_type), do: nil

  @spec filterable_enum_option_pairs(term(), term()) :: MapSet.t()
  def filterable_enum_option_pairs(attribute_ids, enum_option_ids)
      when is_list(attribute_ids) and is_list(enum_option_ids),
      do: ReferenceData.filterable_enum_option_pairs(attribute_ids, enum_option_ids)

  def filterable_enum_option_pairs(_attribute_ids, _enum_option_ids), do: MapSet.new()

  @spec enum_option_belongs_to_attribute?(term(), term()) :: boolean()
  def enum_option_belongs_to_attribute?(attribute_id, enum_option_id)
      when valid_id_guard(attribute_id) and valid_id_guard(enum_option_id),
      do: ReferenceData.enum_option_belongs_to_attribute?(attribute_id, enum_option_id)

  def enum_option_belongs_to_attribute?(_attribute_id, _enum_option_id), do: false

  @spec list_enum_options_for_set(term()) :: [EnumOption.t()]
  def list_enum_options_for_set(enum_set_id) when valid_id_guard(enum_set_id),
    do: ReferenceData.list_enum_options_for_set(enum_set_id)

  def list_enum_options_for_set(_enum_set_id), do: []

  @spec list_enum_options_for_sets(term()) :: %{pos_integer() => [EnumOption.t()]}
  def list_enum_options_for_sets(enum_set_ids) when is_list(enum_set_ids),
    do: ReferenceData.list_enum_options_for_sets(enum_set_ids)

  def list_enum_options_for_sets(_enum_set_ids), do: %{}

  @spec unit_symbol_for_dimension(term()) :: String.t() | nil
  def unit_symbol_for_dimension(nil), do: nil

  def unit_symbol_for_dimension(dimension_id) when valid_id_guard(dimension_id),
    do: ReferenceData.unit_symbol_for_dimension(dimension_id)

  def unit_symbol_for_dimension(_dimension_id), do: nil

  @spec unit_symbols_for_dimensions(term()) :: %{pos_integer() => String.t()}
  def unit_symbols_for_dimensions(dimension_ids) when is_list(dimension_ids),
    do: ReferenceData.unit_symbols_for_dimensions(dimension_ids)

  def unit_symbols_for_dimensions(_dimension_ids), do: %{}

  @spec with_current_attribute_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  def with_current_attribute_metadata_from_taxon_attributes(current_attributes, taxon_attributes)
      when is_list(current_attributes),
      do:
        CurrentAttributes.with_metadata_from_taxon_attributes(
          current_attributes,
          taxon_attributes
        )
end
