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
        false

      %ProductAttributeCurrent{claim_id: ^seed_claim_id} ->
        false

      %ProductAttributeCurrent{claim_id: current_claim_id} ->
        Repo.exists?(
          from correction in SpecificationCorrection,
            join: claim in ProductAttributeClaim,
            on: claim.id == correction.claim_id,
            where:
              correction.product_id == ^product_id and
                correction.attribute_id == ^attribute_id and correction.status == :pending and
                claim.supersedes_claim_id == ^current_claim_id
        )
    end
  end
end
