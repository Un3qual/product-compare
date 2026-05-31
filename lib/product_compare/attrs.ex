defmodule ProductCompare.Attrs do
  @moduledoc false

  @spec fetch(map() | term(), atom(), any()) :: any()
  def fetch(attrs, key, default \\ nil)

  def fetch(attrs, key, default) when is_map(attrs) and is_atom(key) do
    Map.get(attrs, key, Map.get(attrs, Atom.to_string(key), default))
  end

  def fetch(attrs, key, default) when is_list(attrs) and is_atom(key) do
    Keyword.get(attrs, key, default)
  end

  def fetch(_attrs, _key, default), do: default

  @spec ensure_map(term()) :: map()
  def ensure_map(attrs) when is_map(attrs), do: attrs
  def ensure_map(_attrs), do: %{}

  @spec put_present(map(), atom(), any()) :: map()
  def put_present(attrs, _key, nil) when is_map(attrs), do: attrs

  def put_present(attrs, key, value) when is_map(attrs) and is_atom(key) do
    Map.put(attrs, key, value)
  end

  @spec has_key?(map() | term(), atom()) :: boolean()
  def has_key?(attrs, key) when is_map(attrs) and is_atom(key) do
    Map.has_key?(attrs, key) or Map.has_key?(attrs, Atom.to_string(key))
  end

  def has_key?(attrs, key) when is_list(attrs) and is_atom(key) do
    Keyword.has_key?(attrs, key)
  end

  def has_key?(_attrs, _key), do: false

  @spec present?(map() | term(), atom()) :: boolean()
  def present?(attrs, key), do: not is_nil(fetch(attrs, key))
end
