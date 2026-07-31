defmodule ProductCompare.Specs.Definitions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Specs.UnitConversion
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.Dimension
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.EnumSet
  alias ProductCompareSchemas.Specs.Unit

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id_guard(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec upsert_dimension(map()) :: {:ok, Dimension.t()} | {:error, Ecto.Changeset.t()}
  def upsert_dimension(attrs) do
    upsert_by_conflict(Dimension, attrs, [:code])
  end

  @spec upsert_unit(map()) :: {:ok, Unit.t()} | {:error, Ecto.Changeset.t()}
  def upsert_unit(attrs) do
    changeset = Unit.changeset(%Unit{}, attrs)

    if changeset.valid? do
      multiplier = Ecto.Changeset.get_field(changeset, :multiplier_to_base)
      offset = Ecto.Changeset.get_field(changeset, :offset_to_base)
      now = DateTime.utc_now()

      update_fields =
        changeset.changes
        |> Map.drop([:dimension_id, :code, :multiplier_to_base, :offset_to_base])
        |> Map.to_list()

      conflict_query =
        from unit in Unit,
          where:
            unit.multiplier_to_base == ^multiplier and
              unit.offset_to_base == ^offset,
          update: [set: ^(update_fields ++ [updated_at: now])]

      changeset
      |> Repo.insert(
        on_conflict: conflict_query,
        conflict_target: [:dimension_id, :code],
        returning: true,
        allow_stale: true
      )
      |> resolve_semantic_upsert(changeset, Unit, [:dimension_id, :code], [
        :multiplier_to_base,
        :offset_to_base
      ])
    else
      Ecto.Changeset.apply_action(changeset, :insert)
    end
  end

  @spec upsert_enum_set(map()) :: {:ok, EnumSet.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_set(attrs) do
    upsert_by_conflict(EnumSet, attrs, [:code])
  end

  @spec upsert_enum_option(map()) :: {:ok, EnumOption.t()} | {:error, Ecto.Changeset.t()}
  def upsert_enum_option(attrs) do
    upsert_by_conflict(EnumOption, attrs, [:enum_set_id, :code])
  end

  @spec upsert_attribute(map()) :: {:ok, Attribute.t()} | {:error, Ecto.Changeset.t()}
  def upsert_attribute(attrs) do
    changeset =
      %Attribute{}
      |> Attribute.changeset(attrs)
      |> put_default_change(:is_multivalued, false)
      |> put_default_change(:is_derived, false)

    if changeset.valid? do
      data_type = Ecto.Changeset.get_field(changeset, :data_type)
      dimension_id = Ecto.Changeset.get_field(changeset, :dimension_id)
      enum_set_id = Ecto.Changeset.get_field(changeset, :enum_set_id)
      is_multivalued = Ecto.Changeset.get_field(changeset, :is_multivalued)
      is_derived = Ecto.Changeset.get_field(changeset, :is_derived)

      semantic_fields = [:data_type, :dimension_id, :enum_set_id, :is_multivalued, :is_derived]

      update_fields =
        changeset.changes
        |> Map.drop([:code | semantic_fields])
        |> Map.to_list()

      conflict_query =
        from attribute in Attribute,
          where: attribute.data_type == ^data_type,
          where:
            fragment(
              "? IS NOT DISTINCT FROM ?",
              attribute.dimension_id,
              type(^dimension_id, :integer)
            ),
          where:
            fragment(
              "? IS NOT DISTINCT FROM ?",
              attribute.enum_set_id,
              type(^enum_set_id, :integer)
            ),
          where: attribute.is_multivalued == ^is_multivalued,
          where: attribute.is_derived == ^is_derived,
          update: [set: ^update_fields]

      changeset
      |> Repo.insert(
        on_conflict: conflict_query,
        conflict_target: [:code],
        returning: true,
        allow_stale: true
      )
      |> resolve_semantic_upsert(changeset, Attribute, [:code], semantic_fields)
    else
      Ecto.Changeset.apply_action(changeset, :insert)
    end
  end

  @spec convert_to_base(Decimal.t() | number() | binary(), term()) ::
          {:ok, Decimal.t()} | {:error, :unit_not_found | :invalid_decimal}
  def convert_to_base(value_num, unit_id) when valid_id_guard(unit_id) do
    case Repo.get(Unit, unit_id) do
      nil -> {:error, :unit_not_found}
      unit -> to_base(value_num, unit)
    end
  end

  def convert_to_base(_value_num, _unit_id), do: {:error, :unit_not_found}

  @doc false
  @spec to_base(Decimal.t() | number() | binary(), Unit.t()) ::
          {:ok, Decimal.t()} | {:error, :invalid_decimal}
  def to_base(value, unit) do
    case UnitConversion.to_base(value, unit) do
      %Decimal{} = decimal -> {:ok, decimal}
      nil -> {:error, :invalid_decimal}
    end
  end

  defp upsert_by_conflict(schema_module, attrs, conflict_fields) do
    now = DateTime.utc_now()
    changeset = schema_module.changeset(struct(schema_module), attrs)

    update_fields =
      changeset.changes
      |> Map.drop(conflict_fields)
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: conflict_fields,
      returning: true
    )
  end

  defp resolve_semantic_upsert({:ok, %{id: nil}}, changeset, schema, identity_fields, fields) do
    identity =
      Map.new(identity_fields, fn field ->
        {field, Ecto.Changeset.get_field(changeset, field)}
      end)

    existing = Repo.get_by!(schema, identity)

    {:error,
     Enum.reduce(fields, changeset, fn field, error_changeset ->
       requested = Ecto.Changeset.get_field(changeset, field)
       persisted = Map.fetch!(existing, field)

       if semantic_equal?(requested, persisted) do
         error_changeset
       else
         Ecto.Changeset.add_error(
           error_changeset,
           field,
           "does not match the existing #{semantic_owner(schema)}"
         )
       end
     end)}
  end

  defp resolve_semantic_upsert(result, _changeset, _schema, _identity_fields, _fields),
    do: result

  defp semantic_equal?(%Decimal{} = left, %Decimal{} = right), do: Decimal.equal?(left, right)
  defp semantic_equal?(left, right), do: left == right

  defp semantic_owner(Unit), do: "unit"
  defp semantic_owner(Attribute), do: "attribute"

  defp put_default_change(changeset, field, default) do
    if is_nil(Ecto.Changeset.get_field(changeset, field)) do
      Ecto.Changeset.put_change(changeset, field, default)
    else
      changeset
    end
  end
end
