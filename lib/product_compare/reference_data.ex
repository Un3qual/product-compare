defmodule ProductCompare.ReferenceData do
  @moduledoc """
  Recognizes standard reference codes and exposes their CLDR metadata.

  ProductCompare support remains a separate application policy from standard
  recognition so valid external data can be distinguished from supported data.
  """

  alias ProductCompare.ReferenceData.Cldr

  @supported_currencies MapSet.new(["CAD", "EUR", "GBP", "USD"])
  @supported_territories MapSet.new(["CA", "US"])
  @supported_languages MapSet.new(["en", "fr"])

  @spec canonical_currency(term()) :: {:ok, String.t()} | :error
  def canonical_currency(value) when is_binary(value) do
    value
    |> String.trim()
    |> Cldr.Currency.known_currency_code()
    |> canonical_code()
  end

  def canonical_currency(_value), do: :error

  @spec canonical_territory(term()) :: {:ok, String.t()} | :error
  def canonical_territory(value) when is_binary(value) do
    value
    |> String.trim()
    |> Cldr.validate_territory()
    |> canonical_code()
  end

  def canonical_territory(_value), do: :error

  @spec canonical_language(term()) :: {:ok, String.t()} | :error
  def canonical_language(value) when is_binary(value) do
    code = value |> String.trim() |> String.downcase()

    if Map.has_key?(Cldr.Language.known_languages(:en), code), do: {:ok, code}, else: :error
  end

  def canonical_language(_value), do: :error

  @spec supported_currency?(term()) :: boolean()
  def supported_currency?(value),
    do: supported?(value, &canonical_currency/1, @supported_currencies)

  @spec supported_territory?(term()) :: boolean()
  def supported_territory?(value),
    do: supported?(value, &canonical_territory/1, @supported_territories)

  @spec supported_language?(term()) :: boolean()
  def supported_language?(value),
    do: supported?(value, &canonical_language/1, @supported_languages)

  @spec currency(term()) :: {:ok, %{code: String.t(), name: String.t()}} | nil
  def currency(value) do
    with {:ok, code} <- canonical_currency(value),
         {:ok, currency} <- Cldr.Currency.currency_for_code(code) do
      {:ok, %{code: code, name: currency.name}}
    else
      _error -> nil
    end
  end

  @spec territory(term()) :: {:ok, %{code: String.t(), name: String.t()}} | nil
  def territory(value) do
    with {:ok, code} <- canonical_territory(value),
         {:ok, name} <- Cldr.Territory.from_territory_code(code, locale: :en) do
      {:ok, %{code: code, name: name}}
    else
      _error -> nil
    end
  end

  @spec language(term()) :: {:ok, %{code: String.t(), name: String.t()}} | nil
  def language(value) do
    with {:ok, code} <- canonical_language(value),
         {:ok, name} <- Cldr.Language.to_string(code, locale: :en) do
      {:ok, %{code: code, name: name}}
    else
      _error -> nil
    end
  end

  defp canonical_code({:ok, code}) when is_atom(code), do: {:ok, Atom.to_string(code)}
  defp canonical_code({:ok, code}) when is_binary(code), do: {:ok, code}
  defp canonical_code(_error), do: :error

  defp supported?(value, canonicalize, supported_codes) do
    case canonicalize.(value) do
      {:ok, code} -> MapSet.member?(supported_codes, code)
      :error -> false
    end
  end
end
