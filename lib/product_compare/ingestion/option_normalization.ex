defmodule ProductCompare.Ingestion.OptionNormalization do
  @moduledoc false

  def option(opts, key, default) when is_list(opts) do
    if Keyword.keyword?(opts) do
      Keyword.get(opts, key, default)
    else
      default
    end
  end

  def option(opts, key, default) when is_map(opts) and is_atom(key),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key), default))

  def option(opts, key, default) when is_map(opts), do: Map.get(opts, key, default)

  def option(_opts, _key, default), do: default

  def bounded_integer(value, opts) do
    default = Keyword.fetch!(opts, :default)
    min_value = Keyword.fetch!(opts, :min)
    max_value = Keyword.fetch!(opts, :max)

    value
    |> normalize_integer(default)
    |> max(min_value)
    |> min(max_value)
  end

  defp normalize_integer(value, _default) when is_integer(value), do: value

  defp normalize_integer(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {limit, ""} -> limit
      _invalid -> default
    end
  end

  defp normalize_integer(_value, default), do: default
end
