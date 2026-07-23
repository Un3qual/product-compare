defmodule ProductCompare.Catalog.FilterMetadata do
  @moduledoc """
  Display-safe product filter metadata and facet aggregation.
  """

  alias ProductCompare.Catalog.FilterMetadata.AttributeFacets
  alias ProductCompare.Catalog.FilterMetadata.Query
  alias ProductCompare.Catalog.FilterMetadata.TaxonomyFacets

  @type filter_group ::
          nil
          | :primary_type
          | :use_case
          | {:numeric, pos_integer()}
          | {:booleans, pos_integer()}
          | {:enums, pos_integer()}

  @spec metadata(map()) :: map()
  def metadata(filters) when is_map(filters) do
    attribute_facets = AttributeFacets.build(filters)
    taxonomy_facets = TaxonomyFacets.build(filters)

    %{
      result_count: Query.result_count(filters),
      type_options: taxonomy_facets.type_options,
      use_case_options: taxonomy_facets.use_case_options,
      numeric_filters: attribute_facets.numeric_filters,
      boolean_filters: attribute_facets.boolean_filters,
      enum_filters: attribute_facets.enum_filters
    }
  end

  def metadata(_filters), do: metadata(%{})
end
