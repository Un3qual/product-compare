defmodule ProductCompareSchemas.DecimalInput do
  @moduledoc false

  alias ProductCompareSchemas.FiniteDecimal

  @spec to_decimal(term()) :: Decimal.t() | nil
  def to_decimal(value) when is_binary(value), do: value |> String.trim() |> cast()
  def to_decimal(value), do: cast(value)

  defp cast(value) do
    case FiniteDecimal.cast(value) do
      {:ok, decimal} -> decimal
      :error -> nil
    end
  end
end
