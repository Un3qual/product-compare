defmodule ProductCompare.ReferenceData do
  @moduledoc """
  Recognizes standard reference codes and exposes their CLDR metadata.

  ProductCompare support remains a separate application policy from standard
  recognition so valid external data can be distinguished from supported data.
  """

  alias ProductCompare.ReferenceData.Cldr, as: ReferenceDataCldr

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

    case Cldr.Validity.Language.validate(code) do
      {:ok, ^code, _status} -> {:ok, code}
      _error -> :error
    end
  end

  def canonical_language(_value), do: :error

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

  @spec language_name(String.t()) :: {:ok, String.t()} | :error
  defp language_name(code) do
    case apply(ReferenceDataCldr.Language, :to_string, [code, [locale: :en]]) do
      {:ok, name} when is_binary(name) -> {:ok, name}
      _error -> :error
    end
  end
end
