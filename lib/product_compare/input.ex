defmodule ProductCompare.Input do
  @moduledoc false

  @max_signed_bigint 9_223_372_036_854_775_807

  @spec fetch_attr(map() | term(), atom()) :: term()
  def fetch_attr(attrs, key) when is_map(attrs) and is_atom(key),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))

  def fetch_attr(_attrs, _key), do: nil

  @spec attr_key_present?(map() | term(), atom()) :: boolean()
  def attr_key_present?(attrs, key) when is_map(attrs) and is_atom(key),
    do: Map.has_key?(attrs, key) or Map.has_key?(attrs, Atom.to_string(key))

  def attr_key_present?(_attrs, _key), do: false

  @spec pagination_value(keyword() | map() | term(), atom(), integer()) :: integer()
  def pagination_value(opts, key, default) when is_list(opts) do
    opts
    |> Keyword.get(key, default)
    |> parse_integer(default)
  end

  def pagination_value(opts, key, default) when is_map(opts) and is_atom(key) do
    opts
    |> Map.get(key, Map.get(opts, Atom.to_string(key), default))
    |> parse_integer(default)
  end

  def pagination_value(_opts, _key, default), do: default

  @spec normalize_integer_id(term()) :: {:ok, pos_integer()} | :error
  def normalize_integer_id(value)
      when is_integer(value) and value > 0 and value <= @max_signed_bigint,
      do: {:ok, value}

  def normalize_integer_id(value) when is_integer(value), do: :error

  def normalize_integer_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed > 0 and parsed <= @max_signed_bigint -> {:ok, parsed}
      _invalid -> :error
    end
  end

  def normalize_integer_id(_value), do: :error

  @spec clamp_limit(integer(), pos_integer(), pos_integer()) :: pos_integer()
  def clamp_limit(value, _default, max) when is_integer(value) and value > 0, do: min(value, max)
  def clamp_limit(_value, default, _max), do: default

  @spec clamp_non_negative(integer(), non_neg_integer()) :: non_neg_integer()
  def clamp_non_negative(value, _default) when is_integer(value) and value >= 0, do: value
  def clamp_non_negative(_value, default), do: default

  defp parse_integer(value, _default) when is_integer(value), do: value

  defp parse_integer(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> parsed
      _invalid -> default
    end
  end

  defp parse_integer(_value, default), do: default
end
