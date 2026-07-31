defmodule ProductCompare.Specs.Claims.Imports do
  @moduledoc false

  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompare.Specs.TypedValues
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Unit

  @claim_fingerprint_conflict_target {:unsafe_fragment,
                                      "(fingerprint) WHERE fingerprint IS NOT NULL"}

  @spec import_observation(
          pos_integer(),
          pos_integer(),
          atom() | String.t(),
          SpecificationObservation.t()
        ) :: {:ok, map()} | {:error, atom() | Ecto.Changeset.t()}
  def import_observation(product_id, artifact_id, provider, observation) do
    with %Attribute{} = attribute <- Repo.get_by(Attribute, code: observation.attribute_code),
         :ok <- ensure_observation_type(attribute, observation),
         {:ok, typed_value} <- observation_typed_value(attribute, observation),
         {:ok, normalized_value} <- TypedValues.normalize(attribute, typed_value) do
      auto_accept? = auto_accept_import?(attribute, provider, observation.confidence)
      fingerprint = claim_fingerprint(product_id, attribute.id, artifact_id, normalized_value)

      attrs =
        normalized_value
        |> Map.merge(%{
          product_id: product_id,
          attribute_id: attribute.id,
          source_type: :import,
          status: :proposed,
          confidence: observation.confidence,
          fingerprint: fingerprint
        })

      Repo.transaction(fn ->
        with {:ok, claim, replayed} <- insert_or_fetch_imported_claim(attrs, fingerprint),
             :ok <- insert_import_evidence(claim, artifact_id, observation.evidence_excerpt),
             {:ok, claim} <- maybe_auto_accept_imported_claim(claim, auto_accept?, replayed) do
          %{claim: claim, accepted: claim.status == :accepted, replayed: replayed}
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
    else
      nil -> {:error, :attribute_not_found}
      {:error, _reason} = error -> error
    end
  end

  defp ensure_observation_type(%Attribute{data_type: data_type}, %{data_type: data_type}), do: :ok
  defp ensure_observation_type(_attribute, _observation), do: {:error, :attribute_type_mismatch}

  defp observation_typed_value(%Attribute{data_type: :text}, %{value: value})
       when is_binary(value),
       do: {:ok, %{value_text: value}}

  defp observation_typed_value(%Attribute{data_type: :bool}, %{value: value})
       when is_boolean(value),
       do: {:ok, %{value_bool: value}}

  defp observation_typed_value(%Attribute{data_type: :int}, %{value: value})
       when is_integer(value),
       do: {:ok, %{value_int: value}}

  defp observation_typed_value(%Attribute{data_type: :numeric} = attribute, observation) do
    unit =
      Repo.get_by(Unit,
        dimension_id: attribute.dimension_id,
        code: observation.unit_code
      )

    case unit do
      %Unit{} -> {:ok, %{value_num: observation.value, unit_id: unit.id}}
      nil -> {:error, :unit_not_found}
    end
  end

  defp observation_typed_value(%Attribute{data_type: :enum} = attribute, observation) do
    enum_option =
      Repo.get_by(EnumOption,
        enum_set_id: attribute.enum_set_id,
        code: observation.enum_option_code
      )

    case enum_option do
      %EnumOption{} -> {:ok, %{enum_option_id: enum_option.id}}
      nil -> {:error, :invalid_enum_option}
    end
  end

  defp observation_typed_value(%Attribute{data_type: :date}, %{value: %Date{} = value}),
    do: {:ok, %{value_date: value}}

  defp observation_typed_value(%Attribute{data_type: :timestamp}, %{
         value: %DateTime{} = value
       }),
       do: {:ok, %{value_ts: value}}

  defp observation_typed_value(%Attribute{data_type: :json}, %{value: value})
       when is_map(value) or is_list(value),
       do: {:ok, %{value_json: value}}

  defp observation_typed_value(_attribute, _observation), do: {:error, :invalid_typed_value}

  defp auto_accept_import?(attribute, provider, confidence) do
    configured_codes =
      :product_compare
      |> Application.get_env(:ingestion_auto_accept_attributes, %{})
      |> Map.get(to_string(provider), [])

    confidence_high_enough? =
      match?(%Decimal{}, confidence) and Decimal.compare(confidence, Decimal.new("0.90")) != :lt

    attribute.code in configured_codes and confidence_high_enough?
  end

  defp claim_fingerprint(product_id, attribute_id, artifact_id, normalized_value) do
    [product_id, attribute_id, artifact_id, canonical_claim_value(normalized_value)]
    |> Jason.encode!()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end

  defp canonical_claim_value(%Decimal{} = value), do: Decimal.to_string(value, :normal)
  defp canonical_claim_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp canonical_claim_value(%Date{} = value), do: Date.to_iso8601(value)

  defp canonical_claim_value(value) when is_map(value) and not is_struct(value) do
    value
    |> Enum.map(fn {key, nested} -> [to_string(key), canonical_claim_value(nested)] end)
    |> Enum.sort_by(&List.first/1)
  end

  defp canonical_claim_value(value), do: value

  defp insert_or_fetch_imported_claim(attrs, fingerprint) do
    %ProductAttributeClaim{}
    |> ProductAttributeClaim.changeset(attrs)
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: @claim_fingerprint_conflict_target,
      returning: true
    )
    |> case do
      {:ok, %ProductAttributeClaim{id: nil}} ->
        case Repo.get_by(ProductAttributeClaim, fingerprint: fingerprint) do
          %ProductAttributeClaim{} = claim -> {:ok, claim, true}
          nil -> {:error, :imported_claim_not_found}
        end

      {:ok, %ProductAttributeClaim{} = claim} ->
        {:ok, claim, false}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp insert_import_evidence(claim, artifact_id, excerpt) do
    %ClaimEvidence{}
    |> ClaimEvidence.changeset(%{
      claim_id: claim.id,
      artifact_id: artifact_id,
      excerpt: truncate_excerpt(excerpt)
    })
    |> Repo.insert(on_conflict: :nothing)
    |> case do
      {:ok, _evidence} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp truncate_excerpt(value) when is_binary(value), do: String.slice(value, 0, 500)
  defp truncate_excerpt(_value), do: nil

  defp maybe_auto_accept_imported_claim(claim, true, false) do
    %ProductAttributeCurrent{}
    |> ProductAttributeCurrent.changeset(%{
      product_id: claim.product_id,
      attribute_id: claim.attribute_id,
      claim_id: claim.id,
      selected_by: nil
    })
    |> Repo.insert(
      on_conflict: :nothing,
      conflict_target: [:product_id, :attribute_id],
      returning: true
    )
    |> case do
      {:ok, %ProductAttributeCurrent{id: nil}} ->
        {:ok, claim}

      {:ok, %ProductAttributeCurrent{}} ->
        claim
        |> ProductAttributeClaim.changeset(%{status: :accepted})
        |> Repo.update()

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp maybe_auto_accept_imported_claim(claim, _auto_accept?, _replayed), do: {:ok, claim}
end
