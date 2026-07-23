defmodule ProductCompare.Catalog.FilterMetadata.TaxonomyFacets do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.FilterMetadata.Query
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Taxonomy.ProductTaxon
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.TaxonClosure
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @spec build(map()) :: %{type_options: list(), use_case_options: list()}
  def build(filters) do
    %{
      type_options: type_options(filters),
      use_case_options: use_case_options(filters)
    }
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

  defp primary_type_counts(filters) do
    filters
    |> Query.filtered_products(:primary_type)
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
    filtered_query = Query.filtered_products(filters, :use_case)

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

  defp disabled?(0, false), do: true
  defp disabled?(_count, _selected), do: false
end
