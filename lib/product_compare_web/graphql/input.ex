defmodule ProductCompareWeb.GraphQL.Input do
  @moduledoc false

  alias ProductCompareSchemas.DecimalInput
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec fetch_value(map(), atom(), any()) :: any()
  def fetch_value(map, key, default \\ nil)

  def fetch_value(map, key, default) when is_map(map) do
    Map.get(map, key, Map.get(map, Atom.to_string(key), default))
  end

  @spec drop_key(map(), atom()) :: map()
  def drop_key(map, key) when is_map(map) and is_atom(key) do
    map
    |> Map.delete(key)
    |> Map.delete(Atom.to_string(key))
  end

  @spec take_present(map(), [atom()]) :: map()
  def take_present(map, keys) when is_map(map) and is_list(keys) do
    Enum.reduce(keys, %{}, fn key, attrs ->
      case fetch_value(map, key) do
        nil -> attrs
        value -> Map.put(attrs, key, value)
      end
    end)
  end

  @spec take(map(), [atom()]) :: map()
  def take(map, keys) when is_map(map) and is_list(keys) do
    missing = make_ref()

    Enum.reduce(keys, %{}, fn key, attrs ->
      case fetch_value(map, key, missing) do
        ^missing -> attrs
        value -> Map.put(attrs, key, value)
      end
    end)
  end

  @spec put_present(map(), atom(), any()) :: map()
  def put_present(map, _key, nil) when is_map(map), do: map
  def put_present(map, key, value) when is_map(map) and is_atom(key), do: Map.put(map, key, value)

  @spec connection_args(map() | nil) :: map()
  def connection_args(nil), do: %{}

  def connection_args(args) when is_map(args) do
    take_present(args, [:first, :after])
  end

  @spec fetch_list_value(map(), atom()) :: any()
  def fetch_list_value(map, key) do
    case fetch_value(map, key, []) do
      nil -> []
      value -> value
    end
  end

  @spec decode_required_integer_id(any(), GlobalId.type(), String.t()) ::
          {:ok, pos_integer()} | {:error, String.t()}
  def decode_required_integer_id(value, expected_type, field_name) when is_binary(value) do
    case GlobalId.decode_integer(value, expected_type) do
      {:ok, parsed_id} -> {:ok, parsed_id}
      :error -> invalid_id_error(field_name)
    end
  end

  def decode_required_integer_id(_value, _expected_type, field_name),
    do: invalid_id_error(field_name)

  @spec decode_optional_integer_id(any(), GlobalId.type(), String.t()) ::
          {:ok, pos_integer() | nil} | {:error, String.t()}
  def decode_optional_integer_id(nil, _expected_type, _field_name), do: {:ok, nil}

  def decode_optional_integer_id(value, expected_type, field_name),
    do: decode_required_integer_id(value, expected_type, field_name)

  @spec decode_optional_integer_id_field(map(), atom(), GlobalId.type(), String.t()) ::
          {:ok, map()} | {:error, String.t()}
  def decode_optional_integer_id_field(attrs, field, expected_type, field_name)
      when is_map(attrs) and is_atom(field) do
    missing = make_ref()

    case fetch_value(attrs, field, missing) do
      ^missing ->
        {:ok, attrs}

      value ->
        case decode_optional_integer_id(value, expected_type, field_name) do
          {:ok, parsed_id} -> {:ok, attrs |> drop_key(field) |> Map.put(field, parsed_id)}
          {:error, _message} = error -> error
        end
    end
  end

  @spec decode_integer_id_list(any(), GlobalId.type(), String.t(), String.t()) ::
          {:ok, [pos_integer()]} | {:error, String.t()}
  def decode_integer_id_list(
        values,
        expected_type,
        field_name,
        invalid_list_message \\ "invalid ids"
      )

  def decode_integer_id_list(nil, _expected_type, _field_name, _invalid_list_message),
    do: {:ok, []}

  def decode_integer_id_list(values, expected_type, field_name, _invalid_list_message)
      when is_list(values) do
    values
    |> Enum.reduce_while({:ok, []}, fn value, {:ok, acc} ->
      case decode_required_integer_id(value, expected_type, field_name) do
        {:ok, parsed_id} -> {:cont, {:ok, [parsed_id | acc]}}
        {:error, _message} = error -> {:halt, error}
      end
    end)
    |> reverse_ok_list()
  end

  def decode_integer_id_list(_values, _expected_type, _field_name, invalid_list_message),
    do: {:error, invalid_list_message}

  @spec normalize_decimal_value(any()) :: {:ok, Decimal.t() | nil} | {:error, String.t()}
  def normalize_decimal_value(nil), do: {:ok, nil}

  def normalize_decimal_value(value) do
    case DecimalInput.to_decimal(value) do
      %Decimal{} = decimal -> {:ok, decimal}
      nil -> {:error, "invalid numeric value"}
    end
  end

  @spec normalize_boolean_value(any()) :: {:ok, boolean()}
  def normalize_boolean_value(true), do: {:ok, true}
  def normalize_boolean_value(false), do: {:ok, false}
  def normalize_boolean_value(_value), do: {:ok, false}

  @spec decode_required_uuid_id(any(), GlobalId.type(), String.t()) ::
          {:ok, Ecto.UUID.t()} | {:error, String.t()}
  def decode_required_uuid_id(value, expected_type, field_name) when is_binary(value) do
    case GlobalId.decode_uuid(value, expected_type) do
      {:ok, parsed_id} -> {:ok, parsed_id}
      :error -> invalid_id_error(field_name)
    end
  end

  def decode_required_uuid_id(_value, _expected_type, field_name),
    do: invalid_id_error(field_name)

  defp reverse_ok_list({:ok, items}), do: {:ok, Enum.reverse(items)}
  defp reverse_ok_list({:error, _message} = error), do: error

  defp invalid_id_error(field_name), do: {:error, "invalid #{field_name} id"}
end
