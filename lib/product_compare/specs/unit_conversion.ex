defmodule ProductCompare.Specs.UnitConversion do
  @moduledoc """
  Unit conversion helpers using canonical base unit storage.
  """

  alias ProductCompareSchemas.DecimalInput
  alias ProductCompareSchemas.Specs.Unit

  @spec to_base(Decimal.t() | number() | binary(), Unit.t()) :: Decimal.t()
  def to_base(value, %Unit{} = unit) do
    value
    |> DecimalInput.to_decimal()
    |> Decimal.mult(DecimalInput.to_decimal(unit.multiplier_to_base))
    |> Decimal.add(DecimalInput.to_decimal(unit.offset_to_base))
  end
end
