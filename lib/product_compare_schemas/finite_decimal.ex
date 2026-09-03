defmodule ProductCompareSchemas.FiniteDecimal do
  @moduledoc false

  use Ecto.Type

  @impl true
  def type, do: :decimal

  @impl true
  def cast(%Decimal{} = value), do: cast_decimal(value)

  def cast(value), do: Ecto.Type.cast(:decimal, value)

  @impl true
  def dump(%Decimal{} = value), do: cast_decimal(value)

  def dump(value), do: Ecto.Type.dump(:decimal, value)

  @impl true
  def load(%Decimal{} = value), do: cast_decimal(value)

  def load(value), do: Ecto.Type.load(:decimal, value)

  @impl true
  def equal?(left, right), do: Ecto.Type.equal?(:decimal, left, right)

  defp cast_decimal(value) do
    if Decimal.nan?(value) or Decimal.inf?(value), do: :error, else: {:ok, value}
  end
end
