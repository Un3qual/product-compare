defmodule ProductCompare.Specs.Definitions do
  @moduledoc false

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
    upsert_by_conflict(Unit, attrs, [:dimension_id, :code])
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
    changeset = Attribute.changeset(%Attribute{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:code])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields],
      conflict_target: [:code],
      returning: true
    )
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
end
