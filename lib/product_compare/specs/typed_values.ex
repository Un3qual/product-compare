defmodule ProductCompare.Specs.TypedValues do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompare.Specs.Definitions
  alias ProductCompareSchemas.DecimalInput
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.EnumOption
  alias ProductCompareSchemas.Specs.Unit

  @spec normalize(Attribute.t(), map()) :: {:ok, map()} | {:error, term()}
  def normalize(%Attribute{data_type: :bool}, typed_value) do
    with {:ok, value_bool} <- fetch_typed_value(typed_value, :value_bool) do
      {:ok, %{value_bool: value_bool}}
    end
  end

  def normalize(%Attribute{data_type: :int}, typed_value) do
    with {:ok, value_int} <- fetch_typed_value(typed_value, :value_int) do
      {:ok, %{value_int: value_int}}
    end
  end

  def normalize(%Attribute{data_type: :numeric, dimension_id: dimension_id}, typed_value) do
    with {:ok, value_num} <- fetch_typed_value(typed_value, :value_num),
         {:ok, value_num} <- to_decimal(value_num),
         {:ok, unit_id} <- fetch_typed_value(typed_value, :unit_id),
         {:ok, unit} <- fetch_unit(unit_id, dimension_id),
         {:ok, value_num_base_min} <-
           normalize_numeric_range_bound(
             typed_value,
             :value_num_base_min,
             :value_num_min,
             unit
           ),
         {:ok, value_num_base_max} <-
           normalize_numeric_range_bound(
             typed_value,
             :value_num_base_max,
             :value_num_max,
             unit
           ),
         {:ok, value_num_base} <- Definitions.to_base(value_num, unit),
         :ok <- validate_numeric_range(value_num_base_min, value_num_base_max) do
      {:ok,
       %{
         value_num: value_num,
         unit_id: unit_id,
         value_num_base: value_num_base,
         value_num_base_min: value_num_base_min,
         value_num_base_max: value_num_base_max
       }}
    end
  end

  def normalize(%Attribute{data_type: :text}, typed_value) do
    with {:ok, value_text} <- fetch_typed_value(typed_value, :value_text) do
      {:ok, %{value_text: value_text}}
    end
  end

  def normalize(%Attribute{data_type: :enum} = attribute, typed_value) do
    with {:ok, enum_option_id} <- fetch_typed_value(typed_value, :enum_option_id),
         {:ok, validated_enum_option_id} <- validate_enum_option_id(enum_option_id, attribute) do
      {:ok, %{enum_option_id: validated_enum_option_id}}
    end
  end

  def normalize(%Attribute{data_type: :date}, typed_value) do
    with {:ok, value_date} <- fetch_typed_value(typed_value, :value_date) do
      {:ok, %{value_date: value_date}}
    end
  end

  def normalize(%Attribute{data_type: :timestamp}, typed_value) do
    with {:ok, value_ts} <- fetch_typed_value(typed_value, :value_ts) do
      {:ok, %{value_ts: value_ts}}
    end
  end

  def normalize(%Attribute{data_type: :json}, typed_value) do
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

  defp get_value(map, key) when is_map(map) do
    case Map.fetch(map, key) do
      {:ok, value} -> value
      :error -> Map.get(map, Atom.to_string(key))
    end
  end

  defp normalize_numeric_range_bound(typed_value, base_key, source_unit_key, unit) do
    case {get_value(typed_value, base_key), get_value(typed_value, source_unit_key)} do
      {nil, nil} ->
        {:ok, nil}

      {base_value, nil} ->
        to_decimal(base_value)

      {nil, source_unit_value} ->
        with {:ok, source_decimal} <- to_decimal(source_unit_value) do
          Definitions.to_base(source_decimal, unit)
        end

      {_base_value, _source_unit_value} ->
        {:error, {:conflicting_numeric_range_bound, base_key, source_unit_key}}
    end
  end

  defp validate_numeric_range(nil, _max), do: :ok
  defp validate_numeric_range(_min, nil), do: :ok

  defp validate_numeric_range(min, max) do
    if Decimal.compare(min, max) == :gt do
      {:error, :invalid_numeric_range}
    else
      :ok
    end
  end

  defp to_decimal(%Decimal{} = value), do: cast_decimal(value)

  defp to_decimal(value) when is_integer(value) or is_float(value) or is_binary(value) do
    cast_decimal(value)
  end

  defp to_decimal(_value), do: {:error, :invalid_decimal_type}

  defp cast_decimal(value) do
    case DecimalInput.to_decimal(value) do
      %Decimal{} = decimal -> {:ok, decimal}
      nil -> {:error, :invalid_decimal}
    end
  end
end
