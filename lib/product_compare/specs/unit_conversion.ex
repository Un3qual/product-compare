defmodule ProductCompare.Specs.UnitConversion do
  @moduledoc """
  Unit conversion helpers using canonical base unit storage.
  """

  alias ProductCompareSchemas.DecimalInput
  alias ProductCompareSchemas.Specs.Unit

  @spec to_base(Decimal.t() | number() | binary(), Unit.t()) :: Decimal.t() | nil
  def to_base(value, %Unit{} = unit) do
    with %Decimal{} = value <- DecimalInput.to_decimal(value),
         %Decimal{} = multiplier <- DecimalInput.to_decimal(unit.multiplier_to_base),
         %Decimal{} = offset <- DecimalInput.to_decimal(unit.offset_to_base) do
      value
      |> Decimal.mult(multiplier)
      |> Decimal.add(offset)
    else
      _invalid_decimal -> nil
    end
  end
end
