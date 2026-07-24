defmodule ProductCompare.Specs.Claims do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Specs.Claims.Proposals
  alias ProductCompare.Specs.Claims.Imports
  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

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
    update_claim_status(claim_id, moderator_user_id, :accepted)
  end

  def reject_claim(claim_id, moderator_user_id) do
    update_claim_status(claim_id, moderator_user_id, :rejected)
  end

  def select_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    Repo.transaction(fn ->
      with {:ok, _claim} <- lock_selected_claim(product_id, attribute_id, claim_id),
           :ok <- lock_existing_current(product_id, attribute_id),
           {:ok, current} <-
             upsert_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
        current
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, current} -> {:ok, current}
      {:error, reason} -> {:error, reason}
    end
  end

  defp lock_selected_claim(product_id, attribute_id, claim_id) do
    claim =
      Repo.one(
        from claim in ProductAttributeClaim,
          where: claim.id == ^claim_id,
          lock: "FOR UPDATE"
      )

    case claim do
      nil ->
        {:error, :claim_not_found}

      %ProductAttributeClaim{
        product_id: ^product_id,
        attribute_id: ^attribute_id,
        status: :accepted
      } = claim ->
        {:ok, claim}

      %ProductAttributeClaim{product_id: ^product_id, attribute_id: ^attribute_id} ->
        {:error, :claim_not_accepted}

      _ ->
        {:error, :claim_product_attribute_mismatch}
    end
  end

  defp lock_existing_current(product_id, attribute_id) do
    Repo.one(
      from pac in ProductAttributeCurrent,
        where: pac.product_id == ^product_id and pac.attribute_id == ^attribute_id,
        lock: "FOR UPDATE"
    )

    :ok
  end

  defp upsert_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    now = DateTime.utc_now()

    attrs = %{
      product_id: product_id,
      attribute_id: attribute_id,
      claim_id: claim_id,
      selected_by: selector_user_id,
      selected_at: now
    }

    %ProductAttributeCurrent{}
    |> ProductAttributeCurrent.changeset(attrs)
    |> Repo.insert(
      on_conflict: [set: [claim_id: claim_id, selected_by: selector_user_id, selected_at: now]],
      conflict_target: [:product_id, :attribute_id],
      returning: true
    )
  end

  defp update_claim_status(claim_id, _moderator_user_id, new_status) do
    case Repo.get(ProductAttributeClaim, claim_id) do
      nil ->
        {:error, :claim_not_found}

      %ProductAttributeClaim{status: ^new_status} = claim ->
        {:ok, claim}

      %ProductAttributeClaim{status: :proposed} = claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: new_status})
        |> Repo.update()

      %ProductAttributeClaim{} ->
        {:error, :invalid_status_transition}
    end
  end
end
