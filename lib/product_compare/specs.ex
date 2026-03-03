defmodule ProductCompare.Specs do
  @moduledoc """
  Specs context for dimensions, units, attributes, and claim workflows.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias ProductCompare.Repo
  alias ProductCompare.Specs.UnitConversion
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.Dimension
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.EnumSet
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Unit

  @spec upsert_dimension(map()) :: {:ok, Dimension.t()} | {:error, Ecto.Changeset.t()}
  def upsert_dimension(attrs) do
    code = get_value(attrs, :code)

    case Repo.get_by(Dimension, code: code) do
      nil -> %Dimension{} |> Dimension.changeset(attrs) |> Repo.insert()
      dimension -> dimension |> Dimension.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_unit(map()) :: {:ok, Unit.t()} | {:error, Ecto.Changeset.t()}
  def upsert_unit(attrs) do
    dimension_id = get_value(attrs, :dimension_id)
    code = get_value(attrs, :code)

    query = from u in Unit, where: u.dimension_id == ^dimension_id and u.code == ^code

    case Repo.one(query) do
      nil -> %Unit{} |> Unit.changeset(attrs) |> Repo.insert()
      unit -> unit |> Unit.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_enum_set(map()) :: {:ok, EnumSet.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_set(attrs) do
    code = get_value(attrs, :code)

    case Repo.get_by(EnumSet, code: code) do
      nil -> %EnumSet{} |> EnumSet.changeset(attrs) |> Repo.insert()
      enum_set -> enum_set |> EnumSet.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_enum_option(map()) :: {:ok, EnumOption.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_option(attrs) do
    enum_set_id = get_value(attrs, :enum_set_id)
    code = get_value(attrs, :code)

    query = from eo in EnumOption, where: eo.enum_set_id == ^enum_set_id and eo.code == ^code

    case Repo.one(query) do
      nil -> %EnumOption{} |> EnumOption.changeset(attrs) |> Repo.insert()
      enum_option -> enum_option |> EnumOption.changeset(attrs) |> Repo.update()
    end
  end

  @spec upsert_attribute(map()) :: {:ok, Attribute.t()} | {:error, Ecto.Changeset.t()}
  def upsert_attribute(attrs) do
    code = get_value(attrs, :code)

    case Repo.get_by(Attribute, code: code) do
      nil -> %Attribute{} |> Attribute.changeset(attrs) |> Repo.insert()
      attribute -> attribute |> Attribute.changeset(attrs) |> Repo.update()
    end
  end

  @spec convert_to_base(Decimal.t() | number(), pos_integer()) ::
          {:ok, Decimal.t()} | {:error, :unit_not_found}
  def convert_to_base(value_num, unit_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      unit -> {:ok, UnitConversion.to_base(value_num, unit)}
    end
  end

  @spec propose_claim(pos_integer(), pos_integer(), map(), map()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def propose_claim(product_id, attribute_id, typed_value, provenance) do
    with {:ok, attribute} <- fetch_attribute(attribute_id),
         {:ok, normalized_value} <- normalize_typed_value(attribute, typed_value) do
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

      Multi.new()
      |> Multi.insert(:claim, ProductAttributeClaim.changeset(%ProductAttributeClaim{}, attrs))
      |> Multi.run(:evidence, fn repo, %{claim: claim} ->
        maybe_insert_evidence(repo, claim, provenance)
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{claim: claim}} -> {:ok, claim}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end

  @spec accept_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def accept_claim(claim_id, moderator_user_id) do
    update_claim_status(claim_id, moderator_user_id, :accepted)
  end

  @spec reject_claim(pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeClaim.t()} | {:error, term()}
  def reject_claim(claim_id, moderator_user_id) do
    update_claim_status(claim_id, moderator_user_id, :rejected)
  end

  @spec select_current_claim(pos_integer(), pos_integer(), pos_integer(), pos_integer()) ::
          {:ok, ProductAttributeCurrent.t()} | {:error, term()}
  def select_current_claim(product_id, attribute_id, claim_id, selector_user_id) do
    Multi.new()
    |> Multi.run(:claim, fn repo, _changes ->
      case repo.get(ProductAttributeClaim, claim_id) do
        nil ->
          {:error, :claim_not_found}

        %ProductAttributeClaim{product_id: ^product_id, attribute_id: ^attribute_id} = claim ->
          {:ok, claim}

        _ ->
          {:error, :claim_product_attribute_mismatch}
      end
    end)
    |> Multi.run(:lock_existing, fn repo, _changes ->
      repo.one(
        from pac in ProductAttributeCurrent,
          where: pac.product_id == ^product_id and pac.attribute_id == ^attribute_id,
          lock: "FOR UPDATE"
      )

      {:ok, :locked}
    end)
    |> Multi.run(:upsert_current, fn repo, _changes ->
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
      |> repo.insert(
        on_conflict: [set: [claim_id: claim_id, selected_by: selector_user_id, selected_at: now]],
        conflict_target: [:product_id, :attribute_id],
        returning: true
      )
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{upsert_current: current}} -> {:ok, current}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp fetch_attribute(attribute_id) do
    case Repo.get(Attribute, attribute_id) do
      nil -> {:error, :attribute_not_found}
      attribute -> {:ok, attribute}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :bool}, typed_value) do
    with {:ok, value_bool} <- fetch_typed_value(typed_value, :value_bool) do
      {:ok, %{value_bool: value_bool}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :int}, typed_value) do
    with {:ok, value_int} <- fetch_typed_value(typed_value, :value_int) do
      {:ok, %{value_int: value_int}}
    end
  end

  defp normalize_typed_value(
         %Attribute{data_type: :numeric, dimension_id: dimension_id},
         typed_value
       ) do
    with {:ok, value_num} <- fetch_typed_value(typed_value, :value_num),
         {:ok, unit_id} <- fetch_typed_value(typed_value, :unit_id),
         {:ok, unit} <- fetch_unit(unit_id, dimension_id) do
      value_num_base = UnitConversion.to_base(value_num, unit)

      {:ok,
       %{
         value_num: value_num,
         unit_id: unit_id,
         value_num_base: value_num_base,
         value_num_base_min: get_value(typed_value, :value_num_base_min),
         value_num_base_max: get_value(typed_value, :value_num_base_max)
       }}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :text}, typed_value) do
    with {:ok, value_text} <- fetch_typed_value(typed_value, :value_text) do
      {:ok, %{value_text: value_text}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :enum} = attribute, typed_value) do
    with {:ok, enum_option_id} <- fetch_typed_value(typed_value, :enum_option_id),
         {:ok, validated_enum_option_id} <- validate_enum_option_id(enum_option_id, attribute) do
      {:ok, %{enum_option_id: validated_enum_option_id}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :date}, typed_value) do
    with {:ok, value_date} <- fetch_typed_value(typed_value, :value_date) do
      {:ok, %{value_date: value_date}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :timestamp}, typed_value) do
    with {:ok, value_ts} <- fetch_typed_value(typed_value, :value_ts) do
      {:ok, %{value_ts: value_ts}}
    end
  end

  defp normalize_typed_value(%Attribute{data_type: :json}, typed_value) do
    with {:ok, value_json} <- fetch_typed_value(typed_value, :value_json) do
      {:ok, %{value_json: value_json}}
    end
  end

  defp validate_enum_option_id(enum_option_id, %Attribute{enum_set_id: enum_set_id})
       when not is_nil(enum_set_id) do
    case Repo.get(EnumOption, enum_option_id) do
      %EnumOption{enum_set_id: ^enum_set_id} -> {:ok, enum_option_id}
      _ -> {:error, :invalid_enum_option}
    end
  end

  defp validate_enum_option_id(_enum_option_id, _attribute), do: {:error, :invalid_enum_option}

  defp fetch_typed_value(typed_value, key) do
    case get_value(typed_value, key) do
      nil -> {:error, {:missing_typed_value, key}}
      value -> {:ok, value}
    end
  end

  defp fetch_unit(unit_id, dimension_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      %Unit{dimension_id: ^dimension_id} = unit -> {:ok, unit}
      _ -> {:error, :unit_dimension_mismatch}
    end
  end

  defp update_claim_status(claim_id, _moderator_user_id, new_status) do
    case Repo.get(ProductAttributeClaim, claim_id) do
      nil ->
        {:error, :claim_not_found}

      claim ->
        claim
        |> ProductAttributeClaim.changeset(%{status: new_status})
        |> Repo.update()
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

  defp get_value(map, key) when is_map(map) do
    case Map.fetch(map, key) do
      {:ok, value} ->
        value

      :error ->
        Map.get(map, Atom.to_string(key))
    end
  end
end
