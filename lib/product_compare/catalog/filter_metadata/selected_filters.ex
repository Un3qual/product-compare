defmodule ProductCompare.Catalog.FilterMetadata.SelectedFilters do
  @moduledoc false

  @spec numeric(map()) :: map()
  def numeric(filters) do
    filters
    |> Map.get(:numeric, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      case normalize_numeric_filter(filter) do
        nil ->
          acc

        normalized_filter ->
          attribute_id = Map.fetch!(normalized_filter, :attribute_id)

          Map.update(
            acc,
            attribute_id,
            normalized_filter,
            &merge_numeric_filters(&1, normalized_filter)
          )
      end
    end)
  end

  @spec boolean(map()) :: map()
  def boolean(filters) do
    filters
    |> Map.get(:booleans, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      case Map.fetch(filter, :attribute_id) do
        {:ok, attribute_id} ->
          Map.update(acc, attribute_id, filter, &merge_boolean_filters(&1, filter))

        :error ->
          acc
      end
    end)
  end

  @spec enum(map()) :: map()
  def enum(filters) do
    filters
    |> Map.get(:enums, [])
    |> Enum.reduce(%{}, fn filter, acc ->
      with {:ok, attribute_id} <- Map.fetch(filter, :attribute_id),
           {:ok, enum_option_id} <- Map.fetch(filter, :enum_option_id) do
        Map.update(
          acc,
          attribute_id,
          MapSet.new([enum_option_id]),
          &MapSet.put(&1, enum_option_id)
        )
      else
        :error -> acc
      end
    end)
  end

  defp normalize_numeric_filter(filter) do
    with {:ok, attribute_id} <- Map.fetch(filter, :attribute_id) do
      normalized_filter =
        [:min, :max]
        |> Enum.reduce(%{attribute_id: attribute_id}, fn key, acc ->
          case normalize_numeric_bound(Map.get(filter, key)) do
            {:ok, value} -> Map.put(acc, key, value)
            :error -> acc
          end
        end)

      if map_size(normalized_filter) > 1, do: normalized_filter
    else
      :error -> nil
    end
  end

  defp merge_numeric_filters(existing_filter, next_filter) do
    %{
      attribute_id: Map.fetch!(existing_filter, :attribute_id),
      min: merge_numeric_min(Map.get(existing_filter, :min), Map.get(next_filter, :min)),
      max: merge_numeric_max(Map.get(existing_filter, :max), Map.get(next_filter, :max))
    }
  end

  defp merge_numeric_min(nil, value), do: value
  defp merge_numeric_min(value, nil), do: value

  defp merge_numeric_min(existing_value, next_value) do
    case Decimal.compare(decimal_for_compare(existing_value), decimal_for_compare(next_value)) do
      :lt -> next_value
      _comparison -> existing_value
    end
  end

  defp merge_numeric_max(nil, value), do: value
  defp merge_numeric_max(value, nil), do: value

  defp merge_numeric_max(existing_value, next_value) do
    case Decimal.compare(decimal_for_compare(existing_value), decimal_for_compare(next_value)) do
      :gt -> next_value
      _comparison -> existing_value
    end
  end

  defp decimal_for_compare(value) do
    {:ok, decimal} = normalize_numeric_bound(value)
    decimal
  end

  defp normalize_numeric_bound(nil), do: :error
  defp normalize_numeric_bound(%Decimal{} = value), do: {:ok, value}
  defp normalize_numeric_bound(value) when is_integer(value), do: {:ok, Decimal.new(value)}
  defp normalize_numeric_bound(value) when is_float(value), do: {:ok, Decimal.from_float(value)}

  defp normalize_numeric_bound(value) when is_binary(value) do
    case Decimal.parse(value) do
      {decimal, ""} -> {:ok, decimal}
      _invalid -> :error
    end
  end

  defp normalize_numeric_bound(_value), do: :error

  defp merge_boolean_filters(existing_filter, next_filter) do
    existing_value = Map.get(existing_filter, :value)
    next_value = Map.get(next_filter, :value)

    cond do
      is_nil(existing_value) ->
        existing_filter

      existing_value == next_value ->
        existing_filter

      true ->
        %{attribute_id: Map.fetch!(existing_filter, :attribute_id), value: nil}
    end
  end
end
