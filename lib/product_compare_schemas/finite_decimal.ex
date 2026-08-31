defmodule ProductCompareSchemas.FiniteDecimal do
  @moduledoc false

  use Ecto.Type

  @impl true
  def type, do: :decimal

  @impl true
  def cast(%Decimal{} = value) do
    if finite?(value), do: {:ok, value}, else: :error
  end

  def cast(value), do: Ecto.Type.cast(:decimal, value)

  @impl true
  def dump(%Decimal{} = value) do
    if finite?(value), do: {:ok, value}, else: :error
  end

  def dump(value), do: Ecto.Type.dump(:decimal, value)

  @impl true
  def load(%Decimal{} = value) do
    if finite?(value), do: {:ok, value}, else: :error
  end

  def load(value), do: Ecto.Type.load(:decimal, value)

  @impl true
  def equal?(left, right), do: Ecto.Type.equal?(:decimal, left, right)

  defp finite?(value), do: not Decimal.nan?(value) and not Decimal.inf?(value)
end
