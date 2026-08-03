defmodule ProductCompare.ReferenceData do
  @moduledoc """
  Recognizes standard reference codes and exposes their CLDR metadata.

  ProductCompare support remains a separate application policy from standard
  recognition so valid external data can be distinguished from supported data.
  """

  alias ProductCompare.ReferenceData.Cldr, as: ReferenceDataCldr

  @supported_currencies %{"CAD" => true, "EUR" => true, "GBP" => true, "USD" => true}
  @supported_territories %{"CA" => true, "US" => true}
  @supported_languages %{"en" => true, "fr" => true}

  @spec canonical_currency(term()) :: {:ok, String.t()} | :error
  def canonical_currency(value) when is_binary(value) do
    with {:ok, code} <- Cldr.validate_currency(String.trim(value)),
         true <- ReferenceDataCldr.Currency.known_currency_code?(code) do
      {:ok, Atom.to_string(code)}
    else
      _error -> :error
    end
  end

  def canonical_currency(_value), do: :error

  @spec canonical_territory(term()) :: {:ok, String.t()} | :error
  def canonical_territory(value) when is_binary(value) do
    case Cldr.validate_territory(String.trim(value)) do
      {:ok, code} when is_atom(code) -> {:ok, Atom.to_string(code)}
      _error -> :error
    end
  end

  def canonical_territory(_value), do: :error

  @spec canonical_language(term()) :: {:ok, String.t()} | :error
  def canonical_language(value) when is_binary(value) do
    code = value |> String.trim() |> String.downcase()

    case known_languages() do
      languages when is_map(languages) ->
        if Map.has_key?(languages, code), do: {:ok, code}, else: :error

      _error ->
        :error
    end
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

  @spec currency(term()) ::
          {:ok, %{code: String.t(), name: String.t(), minor_unit: non_neg_integer() | nil}} | nil
  def currency(value) do
    with {:ok, code} <- canonical_currency(value),
         {:ok, currency} <-
           ReferenceDataCldr.Currency.currency_for_code(String.to_existing_atom(code)) do
      {:ok, %{code: code, name: currency.name, minor_unit: currency.iso_digits}}
    else
      _error -> nil
    end
  end

  @spec territory(term()) :: {:ok, %{code: String.t(), name: String.t()}} | nil
  def territory(value) do
    with {:ok, code} <- canonical_territory(value),
         {:ok, name} <- ReferenceDataCldr.Territory.from_territory_code(code, locale: :en) do
      {:ok, %{code: code, name: name}}
    else
      _error -> nil
    end
  end

  @spec language(term()) :: {:ok, %{code: String.t(), name: String.t()}} | nil
  def language(value) do
    with {:ok, code} <- canonical_language(value),
         {:ok, name} <- language_name(code) do
      {:ok, %{code: code, name: name}}
    else
      _error -> nil
    end
  end

  # The generated CLDR language backend dispatches configured locales by atom,
  # but exposes an imprecise static contract for that dispatch.
  @spec known_languages() :: map() | :error
  defp known_languages do
    case apply(ReferenceDataCldr.Language, :known_languages, [:en]) do
      languages when is_map(languages) -> languages
      _error -> :error
    end
  end

  @spec language_name(String.t()) :: {:ok, String.t()} | :error
  defp language_name(code) do
    case apply(ReferenceDataCldr.Language, :to_string, [code, [locale: :en]]) do
      {:ok, name} when is_binary(name) -> {:ok, name}
      _error -> :error
    end
  end

  @spec supported?(term(), (term() -> {:ok, String.t()} | :error), %{String.t() => true}) ::
          boolean()
  defp supported?(value, canonicalize, supported_codes) do
    case canonicalize.(value) do
      {:ok, code} -> Map.has_key?(supported_codes, code)
      :error -> false
    end
  end
end
