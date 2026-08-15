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

  @spec preserved_current_scopes([map()]) :: MapSet.t({pos_integer(), pos_integer()})
  def preserved_current_scopes([]), do: MapSet.new()

  def preserved_current_scopes(current_rows) do
    product_ids = current_rows |> Enum.map(& &1.product_id) |> Enum.uniq()
    attribute_ids = current_rows |> Enum.map(& &1.attribute_id) |> Enum.uniq()

    seed_claim_ids =
      Map.new(current_rows, fn row ->
        {{row.product_id, row.attribute_id}, row.claim_id}
      end)

    accepted_replacement_scopes =
      ProductAttributeCurrent
      |> join(:inner, [current], claim in ProductAttributeClaim, on: claim.id == current.claim_id)
      |> where(
        [current, claim],
        current.product_id in ^product_ids and current.attribute_id in ^attribute_ids and
          claim.status == :accepted
      )
      |> select([current], {current.product_id, current.attribute_id, current.claim_id})
      |> Repo.all()
      |> Enum.flat_map(fn {product_id, attribute_id, current_claim_id} ->
        scope = {product_id, attribute_id}

        case Map.fetch(seed_claim_ids, scope) do
          {:ok, ^current_claim_id} -> []
          {:ok, _seed_claim_id} -> [scope]
          :error -> []
        end
      end)
      |> MapSet.new()

    pending_scopes =
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

    MapSet.union(accepted_replacement_scopes, pending_scopes)
  end
end
