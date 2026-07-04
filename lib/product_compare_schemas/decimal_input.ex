defmodule ProductCompareSchemas.DecimalInput do
  @moduledoc false

  @spec to_decimal(Decimal.t() | integer() | float() | binary()) :: Decimal.t() | nil
  def to_decimal(%Decimal{} = value), do: value
  def to_decimal(value) when is_integer(value), do: Decimal.new(value)
  def to_decimal(value) when is_float(value), do: Decimal.from_float(value)

  def to_decimal(value) when is_binary(value) do
    case Decimal.parse(value) do
      {%Decimal{} = decimal, ""} -> decimal
      _invalid -> nil
    end
  end
end
