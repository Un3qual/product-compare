defmodule ProductCompare.DevSeeds.CorrectionSafety do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @spec lock_correction_submissions!() :: :ok
  def lock_correction_submissions! do
    Repo.query!("LOCK TABLE specification_corrections IN SHARE MODE")
    :ok
  end

  @spec preserve_current_for_pending?(pos_integer(), pos_integer(), pos_integer()) :: boolean()
  def preserve_current_for_pending?(product_id, attribute_id, seed_claim_id) do
    case Repo.get_by(ProductAttributeCurrent,
           product_id: product_id,
           attribute_id: attribute_id
         ) do
      nil ->
        pending_correction_depends_on?(product_id, attribute_id, nil)

      %ProductAttributeCurrent{claim_id: ^seed_claim_id} ->
        pending_correction_depends_on?(product_id, attribute_id, seed_claim_id)

      %ProductAttributeCurrent{claim_id: current_claim_id} ->
        pending_correction_depends_on?(product_id, attribute_id, current_claim_id)
    end
  end

  defp pending_correction_depends_on?(product_id, attribute_id, current_claim_id) do
    query =
      from correction in SpecificationCorrection,
        join: claim in ProductAttributeClaim,
        on: claim.id == correction.claim_id,
        where:
          correction.product_id == ^product_id and
            correction.attribute_id == ^attribute_id and correction.status == :pending

    query =
      case current_claim_id do
        nil -> where(query, [_correction, claim], is_nil(claim.supersedes_claim_id))
        claim_id -> where(query, [_correction, claim], claim.supersedes_claim_id == ^claim_id)
      end

    Repo.exists?(query)
  end

  @spec without_pending_current_replacements([map()]) :: [map()]
  def without_pending_current_replacements([]), do: []

  def without_pending_current_replacements(current_rows) do
    product_ids = current_rows |> Enum.map(& &1.product_id) |> Enum.uniq()
    attribute_ids = current_rows |> Enum.map(& &1.attribute_id) |> Enum.uniq()

    preserved_scopes =
      SpecificationCorrection
      |> join(:inner, [correction], claim in ProductAttributeClaim,
        on: claim.id == correction.claim_id
      )
      |> join(:left, [correction], current in ProductAttributeCurrent,
        on:
          current.product_id == correction.product_id and
            current.attribute_id == correction.attribute_id
      )
      |> where(
        [correction],
        correction.status == :pending and correction.product_id in ^product_ids and
          correction.attribute_id in ^attribute_ids
      )
      |> where(
        [_correction, claim, current],
        claim.supersedes_claim_id == current.claim_id or
          (is_nil(claim.supersedes_claim_id) and is_nil(current.id))
      )
      |> select([correction], {correction.product_id, correction.attribute_id})
      |> Repo.all()
      |> MapSet.new()

    Enum.reject(current_rows, fn row ->
      MapSet.member?(preserved_scopes, {row.product_id, row.attribute_id})
    end)
  end
end
