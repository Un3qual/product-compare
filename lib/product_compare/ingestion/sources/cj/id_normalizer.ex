defmodule ProductCompare.Ingestion.Sources.CJ.IdNormalizer do
  @moduledoc false

  @spec normalize_id(term()) :: String.t() | nil
  def normalize_id(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      trimmed -> trimmed
    end
  end

  def normalize_id(value) when is_integer(value), do: Integer.to_string(value)
  def normalize_id(_value), do: nil

  @spec normalize_ids(term()) :: [String.t()] | nil
  def normalize_ids(nil), do: nil

  def normalize_ids(value) when is_list(value) do
    value
    |> Enum.map(&normalize_id/1)
    |> Enum.reject(&is_nil/1)
    |> empty_list_to_nil()
  end

  def normalize_ids(value) do
    case normalize_id(value) do
      nil -> nil
      normalized -> [normalized]
    end
  end

  @spec blank_to_nil(term()) :: term()
  def blank_to_nil(value) when is_binary(value), do: normalize_id(value)
  def blank_to_nil(value), do: value

  defp empty_list_to_nil([]), do: nil
  defp empty_list_to_nil(values), do: values
end
