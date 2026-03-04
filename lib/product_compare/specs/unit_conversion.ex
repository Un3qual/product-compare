defmodule ProductCompare.Specs.UnitConversion do
  @moduledoc """
  Unit conversion helpers using canonical base unit storage.
  """

  alias ProductCompareSchemas.Specs.Unit

  @spec to_base(Decimal.t() | number() | binary(), Unit.t()) :: Decimal.t()
  def to_base(value, %Unit{} = unit) do
    value
    |> to_decimal()
    |> Decimal.mult(to_decimal(unit.multiplier_to_base))
    |> Decimal.add(to_decimal(unit.offset_to_base))
  end

  defp to_decimal(%Decimal{} = value), do: value
  defp to_decimal(value) when is_integer(value), do: Decimal.new(value)
  defp to_decimal(value) when is_float(value), do: Decimal.from_float(value)
  defp to_decimal(value) when is_binary(value), do: Decimal.new(value)
end
