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

  @spec get_source_artifact(term()) :: SourceArtifact.t() | nil
  defdelegate get_source_artifact(id), to: Artifacts, as: :get

  @spec get_source_artifacts([term()]) :: %{optional(pos_integer()) => SourceArtifact.t() | nil}
  defdelegate get_source_artifacts(ids), to: Artifacts, as: :get_many

  @spec list_current_attributes_for_products([pos_integer()], keyword()) :: %{
          optional(pos_integer()) => [map()]
        }
  def list_current_attributes_for_products(product_ids, opts \\ []),
    do: CurrentAttributes.for_products(product_ids, opts)

  @spec list_current_attributes_for_product(term()) :: [map()]
  defdelegate list_current_attributes_for_product(product_id),
    to: CurrentAttributes,
    as: :for_product

  @spec with_current_attribute_metadata([ProductAttributeCurrent.t()], pos_integer() | nil) :: [
          map()
        ]
  defdelegate with_current_attribute_metadata(current_attributes, taxon_id),
    to: CurrentAttributes,
    as: :with_metadata

  @spec list_filterable_attributes([atom()]) :: [Attribute.t()]
  defdelegate list_filterable_attributes(data_types), to: ReferenceData

  @spec filterable_attribute_types(term()) :: %{pos_integer() => atom()}
  defdelegate filterable_attribute_types(attribute_ids), to: ReferenceData

  @spec get_filterable_attribute(term(), term()) :: Attribute.t() | nil
  defdelegate get_filterable_attribute(attribute_id, data_type), to: ReferenceData

  @spec filterable_enum_option_pairs(term(), term()) :: MapSet.t()
  defdelegate filterable_enum_option_pairs(attribute_ids, enum_option_ids), to: ReferenceData

  @spec enum_option_belongs_to_attribute?(term(), term()) :: boolean()
  defdelegate enum_option_belongs_to_attribute?(attribute_id, enum_option_id), to: ReferenceData

  @spec list_enum_options_for_set(term()) :: [EnumOption.t()]
  defdelegate list_enum_options_for_set(enum_set_id), to: ReferenceData

  @spec list_enum_options_for_sets(term()) :: %{pos_integer() => [EnumOption.t()]}
  defdelegate list_enum_options_for_sets(enum_set_ids), to: ReferenceData

  @spec unit_symbol_for_dimension(term()) :: String.t() | nil
  defdelegate unit_symbol_for_dimension(dimension_id), to: ReferenceData

  @spec unit_symbols_for_dimensions(term()) :: %{pos_integer() => String.t()}
  defdelegate unit_symbols_for_dimensions(dimension_ids), to: ReferenceData

  @spec with_current_attribute_metadata_from_taxon_attributes(
          [ProductAttributeCurrent.t()],
          [TaxonAttribute.t()] | nil
        ) :: [map()]
  defdelegate with_current_attribute_metadata_from_taxon_attributes(
                current_attributes,
                taxon_attributes
              ),
              to: CurrentAttributes,
              as: :with_metadata_from_taxon_attributes
end
