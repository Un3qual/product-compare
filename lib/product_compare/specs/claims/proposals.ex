defmodule ProductCompare.Specs.Claims.Proposals do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompare.Specs.TypedValues
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.ProductAttributeClaim

  @spec propose(pos_integer(), pos_integer(), map(), map()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, Ecto.Changeset.t() | atom()}
  def propose(product_id, attribute_id, typed_value, provenance) do
    with {:ok, attribute} <- fetch_attribute(attribute_id),
         {:ok, normalized_value} <- TypedValues.normalize(attribute, typed_value) do
      attrs =
        normalized_value
        |> Map.merge(%{
          product_id: product_id,
          attribute_id: attribute_id,
          source_type: Map.get(provenance, :source_type, :user),
          status: :proposed,
          created_by: Map.get(provenance, :created_by),
          confidence: Map.get(provenance, :confidence)
        })

      changeset = ProductAttributeClaim.changeset(%ProductAttributeClaim{}, attrs)

      if changeset.valid? do
        Repo.transaction(fn ->
          with {:ok, claim} <- Repo.insert(changeset),
               {:ok, _evidence} <- maybe_insert_evidence(Repo, claim, provenance) do
            claim
          else
            {:error, reason} -> Repo.rollback(reason)
          end
        end)
        |> case do
          {:ok, claim} -> {:ok, claim}
          {:error, reason} -> {:error, reason}
        end
      else
        Ecto.Changeset.apply_action(changeset, :insert)
      end
    end
  end

  defp fetch_attribute(attribute_id) do
    case Repo.get(Attribute, attribute_id) do
      nil -> {:error, :attribute_not_found}
      attribute -> {:ok, attribute}
    end
  end

  defp maybe_insert_evidence(repo, claim, provenance) do
    case Map.get(provenance, :artifact_id) do
      nil ->
        {:ok, :no_evidence}

      artifact_id ->
        evidence_attrs = %{
          claim_id: claim.id,
          artifact_id: artifact_id,
          excerpt: Map.get(provenance, :excerpt)
        }

        %ClaimEvidence{}
        |> ClaimEvidence.changeset(evidence_attrs)
        |> repo.insert(on_conflict: :nothing)
    end
  end
end
