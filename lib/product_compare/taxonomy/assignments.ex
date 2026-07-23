defmodule ProductCompare.Taxonomy.Assignments do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy.Taxonomies
  alias ProductCompareSchemas.Taxonomy.ProductTaxon

  def assign_use_case(product_id, use_case_taxon_id, created_by, source_type, confidence) do
    with {:ok, :use_case} <- Taxonomies.ensure_taxon_in_taxonomy(use_case_taxon_id, "use_case") do
      %ProductTaxon{}
      |> ProductTaxon.changeset(%{
        product_id: product_id,
        taxon_id: use_case_taxon_id,
        created_by: created_by,
        source_type: source_type,
        confidence: confidence
      })
      |> Repo.insert(
        on_conflict: {:replace, [:source_type, :confidence, :created_by, :inserted_at]},
        conflict_target: [:product_id, :taxon_id],
        returning: true
      )
    end
  end

  def unassign_use_case(product_id, use_case_taxon_id) do
    {count, _} =
      Repo.delete_all(
        from pt in ProductTaxon,
          where: pt.product_id == ^product_id and pt.taxon_id == ^use_case_taxon_id
      )

    {:ok, count}
  end
end
