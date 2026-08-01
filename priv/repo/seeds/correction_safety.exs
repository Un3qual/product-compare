defmodule ProductCompare.DevSeeds.CorrectionSafety do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  @spec preserve_current_for_pending?(pos_integer(), pos_integer(), pos_integer()) :: boolean()
  def preserve_current_for_pending?(product_id, attribute_id, seed_claim_id) do
    case Repo.get_by(ProductAttributeCurrent,
           product_id: product_id,
           attribute_id: attribute_id
         ) do
      nil ->
        pending_correction_depends_on?(product_id, attribute_id, nil)

      %ProductAttributeCurrent{claim_id: ^seed_claim_id} ->
        false

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
end
