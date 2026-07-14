defmodule ProductCompare.Specs.ClaimValue do
  @moduledoc false

  @spec format(map()) :: String.t()
  def format(%{value_bool: value}) when is_boolean(value),
    do: if(value, do: "Yes", else: "No")

  def format(%{value_int: value}) when is_integer(value),
    do: Integer.to_string(value)

  def format(%{value_num: %Decimal{} = value, unit: unit}) do
    suffix = unit && (unit.symbol || unit.code)
    value = value |> Decimal.normalize() |> Decimal.to_string(:normal)
    if is_binary(suffix) and suffix != "", do: "#{value} #{suffix}", else: value
  end

  def format(%{value_text: value}) when is_binary(value), do: value
  def format(%{value_date: %Date{} = value}), do: Date.to_iso8601(value)
  def format(%{value_ts: %DateTime{} = value}), do: DateTime.to_iso8601(value)
  def format(%{enum_option: %{label: value}}) when is_binary(value), do: value
  def format(%{value_json: value}) when not is_nil(value), do: Jason.encode!(value)
  def format(_claim), do: ""
end
