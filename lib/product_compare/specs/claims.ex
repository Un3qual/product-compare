defmodule ProductCompare.Specs.Claims do
  @moduledoc false

  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Specs.Claims.Imports
  alias ProductCompare.Specs.Claims.Moderation
  alias ProductCompare.Specs.Claims.Proposals

  def propose_claim(product_id, attribute_id, typed_value, provenance) do
    Proposals.propose(product_id, attribute_id, typed_value, provenance)
  end

  def import_observation(
        product_id,
        artifact_id,
        provider,
        %SpecificationObservation{} = observation
      ),
      do: Imports.import_observation(product_id, artifact_id, provider, observation)

  def accept_claim(claim_id, moderator_user_id) do
    Moderation.accept(claim_id, moderator_user_id)
  end

  def reject_claim(claim_id, moderator_user_id) do
    Moderation.reject(claim_id, moderator_user_id)
  end

  def select_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    Moderation.select_current(product_id, attribute_id, claim_id, selector_user_id)
  end
end
