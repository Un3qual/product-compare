defmodule ProductCompare.Catalog.GTIN do
  @moduledoc """
  Normalizes and validates Global Trade Item Numbers without dropping leading
  zeroes.
  """

  @supported_lengths [8, 12, 13, 14]

  @spec normalize(term()) :: {:ok, String.t()} | {:error, :invalid_gtin}
  def normalize(value) when is_binary(value) do
    with true <- Regex.match?(~r/^[0-9\s-]+$/u, value),
         normalized <- String.replace(value, ~r/[\s-]/u, ""),
         true <- String.length(normalized) in @supported_lengths,
         true <- valid_checksum?(normalized) do
      {:ok, normalized}
    else
      _invalid -> {:error, :invalid_gtin}
    end
  end

  def normalize(_value), do: {:error, :invalid_gtin}

  defp valid_checksum?(gtin) do
    {body, check_digit} = String.split_at(gtin, -1)

    weighted_sum =
      body
      |> String.graphemes()
      |> Enum.reverse()
      |> Stream.with_index()
      |> Enum.reduce(0, fn {digit, index}, total ->
        weight = if rem(index, 2) == 0, do: 3, else: 1
        total + String.to_integer(digit) * weight
      end)

    expected_check_digit = rem(10 - rem(weighted_sum, 10), 10)
    Integer.to_string(expected_check_digit) == check_digit
  end
end
