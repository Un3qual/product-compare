defmodule ProductCompare.Specs.Corrections do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Accounts, Repo}
  alias ProductCompare.Specs.TypedValues
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  def propose_correction(product_id, attribute_id, user_id, typed_value, attrs) do
    with %Product{} <- Repo.get(Product, product_id),
         {:ok, attribute} <- fetch_attribute(attribute_id),
         {:ok, normalized_value} <- TypedValues.normalize(attribute, typed_value) do
      Repo.transaction(fn ->
        Repo.query!("LOCK TABLE specification_corrections IN ROW EXCLUSIVE MODE")

        current_claim_id =
          Repo.one(
            from current in ProductAttributeCurrent,
              where: current.product_id == ^product_id and current.attribute_id == ^attribute_id,
              select: current.claim_id,
              lock: "FOR UPDATE"
          )

        claim_attrs =
          normalized_value
          |> Map.merge(%{
            product_id: product_id,
            attribute_id: attribute_id,
            source_type: :user,
            status: :proposed,
            created_by: user_id,
            supersedes_claim_id: current_claim_id
          })

        claim_changeset = ProductAttributeClaim.changeset(%ProductAttributeClaim{}, claim_attrs)

        with {:ok, claim} <- Repo.insert(claim_changeset),
             {:ok, correction} <-
               insert_correction(claim, product_id, attribute_id, user_id, attrs) do
          correction
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
      |> case do
        {:ok, correction} -> {:ok, preload_correction(correction)}
        {:error, reason} -> {:error, reason}
      end
    else
      nil -> {:error, :product_not_found}
      {:error, _reason} = error -> error
    end
  end

  def list_user_corrections_query(user_id, opts) do
    SpecificationCorrection
    |> where([correction], correction.submitted_by == ^user_id)
    |> maybe_filter_correction_status(Keyword.get(opts, :status))
    |> order_by([correction], desc: correction.inserted_at, desc: correction.id)
    |> preload([:product, :attribute, claim: [:unit, :enum_option]])
  end

  def list_correction_moderation_query(opts) do
    SpecificationCorrection
    |> maybe_filter_correction_status(Keyword.get(opts, :status, :pending))
    |> order_by([correction], asc: correction.inserted_at, asc: correction.id)
    |> preload([:product, :attribute, claim: [:unit, :enum_option]])
  end

  def correction_counts_for_product(product_id) do
    SpecificationCorrection
    |> where([correction], correction.product_id == ^product_id)
    |> where([correction], correction.status in [:pending, :accepted])
    |> group_by([correction], [correction.attribute_id, correction.status])
    |> select([correction], {correction.attribute_id, correction.status, count(correction.id)})
    |> Repo.all()
    |> correction_counts_from_rows()
  end

  def correction_counts(corrections) do
    corrections
    |> Enum.filter(&(&1.status in [:pending, :accepted]))
    |> Enum.frequencies_by(&{&1.attribute_id, &1.status})
    |> Enum.map(fn {{attribute_id, status}, count} -> {attribute_id, status, count} end)
    |> correction_counts_from_rows()
  end

  def moderate_correction(correction_id, moderator_id, decision, attrs) do
    Repo.transaction(fn ->
      case Accounts.lock_operator(moderator_id) do
        {:ok, _operator} ->
          correction =
            Repo.one(
              from correction in SpecificationCorrection,
                where: correction.id == ^correction_id,
                lock: "FOR UPDATE"
            )

          case correction do
            nil ->
              Repo.rollback(:correction_not_found)

            %SpecificationCorrection{status: ^decision} ->
              correction

            %SpecificationCorrection{status: status} when status != :pending ->
              Repo.rollback(:invalid_status_transition)

            %SpecificationCorrection{} = correction ->
              moderate_pending_correction(correction, moderator_id, decision, attrs)
          end

        {:error, reason} ->
          Repo.rollback(reason)
      end
    end)
    |> case do
      {:ok, correction} -> {:ok, preload_correction(correction)}
      {:error, reason} -> {:error, reason}
    end
  end

  defp fetch_attribute(attribute_id) do
    case Repo.get(Attribute, attribute_id) do
      nil -> {:error, :attribute_not_found}
      attribute -> {:ok, attribute}
    end
  end

  defp insert_correction(claim, product_id, attribute_id, user_id, attrs) do
    correction_attrs =
      attrs
      |> Map.take([:reason, :source_url, :explanation])
      |> Map.merge(%{
        claim_id: claim.id,
        product_id: product_id,
        attribute_id: attribute_id,
        submitted_by: user_id,
        status: :pending
      })

    %SpecificationCorrection{}
    |> SpecificationCorrection.changeset(correction_attrs)
    |> Repo.insert()
  end

  defp correction_counts_from_rows(rows) do
    Enum.reduce(rows, %{}, fn {attribute_id, status, count}, counts ->
      Map.update(
        counts,
        attribute_id,
        %{
          pending: if(status == :pending, do: count, else: 0),
          accepted: if(status == :accepted, do: count, else: 0)
        },
        &Map.put(&1, status, count)
      )
    end)
  end

  defp moderate_pending_correction(correction, moderator_id, :rejected, attrs) do
    claim = lock_correction_claim!(correction.claim_id)

    with {:ok, _claim} <-
           claim
           |> ProductAttributeClaim.changeset(%{status: :rejected})
           |> Repo.update(),
         {:ok, correction} <-
           update_correction_decision(correction, moderator_id, :rejected, attrs) do
      correction
    else
      {:error, reason} -> Repo.rollback(reason)
    end
  end

  defp moderate_pending_correction(correction, moderator_id, :accepted, attrs) do
    claim = lock_correction_claim!(correction.claim_id)

    current =
      Repo.one(
        from current in ProductAttributeCurrent,
          where:
            current.product_id == ^correction.product_id and
              current.attribute_id == ^correction.attribute_id,
          lock: "FOR UPDATE"
      )

    current_claim_id = current && current.claim_id

    if current_claim_id != claim.supersedes_claim_id do
      Repo.rollback(:stale_current_claim)
    end

    with :ok <- supersede_previous_current(current),
         {:ok, _claim} <-
           claim
           |> ProductAttributeClaim.changeset(%{status: :accepted})
           |> Repo.update(),
         {:ok, _current} <- upsert_correction_current(correction, moderator_id),
         {:ok, correction} <-
           update_correction_decision(correction, moderator_id, :accepted, attrs) do
      correction
    else
      {:error, reason} -> Repo.rollback(reason)
    end
  end

  defp lock_correction_claim!(claim_id) do
    Repo.one!(
      from claim in ProductAttributeClaim,
        where: claim.id == ^claim_id and claim.status == :proposed,
        lock: "FOR UPDATE"
    )
  end

  defp supersede_previous_current(nil), do: :ok

  defp supersede_previous_current(%ProductAttributeCurrent{claim_id: claim_id}) do
    claim = Repo.get!(ProductAttributeClaim, claim_id)

    case claim
         |> ProductAttributeClaim.changeset(%{status: :superseded})
         |> Repo.update() do
      {:ok, _claim} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp upsert_correction_current(correction, moderator_id) do
    now = DateTime.utc_now()

    %ProductAttributeCurrent{}
    |> ProductAttributeCurrent.changeset(%{
      product_id: correction.product_id,
      attribute_id: correction.attribute_id,
      claim_id: correction.claim_id,
      selected_by: moderator_id,
      selected_at: now
    })
    |> Repo.insert(
      on_conflict: [
        set: [claim_id: correction.claim_id, selected_by: moderator_id, selected_at: now]
      ],
      conflict_target: [:product_id, :attribute_id],
      returning: true
    )
  end

  defp update_correction_decision(correction, moderator_id, decision, attrs) do
    moderation_attrs = %{
      status: decision,
      reviewed_by: moderator_id,
      reviewed_at: DateTime.utc_now(),
      moderation_note: Map.get(attrs, :moderation_note)
    }

    correction
    |> SpecificationCorrection.moderation_changeset(moderation_attrs)
    |> Repo.update()
  end

  defp maybe_filter_correction_status(query, nil), do: query

  defp maybe_filter_correction_status(query, status)
       when status in [:pending, :accepted, :rejected] do
    where(query, [correction], correction.status == ^status)
  end

  defp maybe_filter_correction_status(query, _status), do: where(query, [correction], false)

  defp preload_correction(correction) do
    Repo.preload(correction, [:product, :attribute, claim: [:unit, :enum_option]])
  end
end
