defmodule ProductCompareSchemas.Reference.ReferenceCode do
  @moduledoc """
  Maps stable public reference codes to controlled integer identifiers.
  """

  use Ecto.ParameterizedType

  alias ProductCompare.ReferenceData

  @impl true
  def init(opts) do
    codes = Keyword.fetch!(opts, :codes)
    normalization = Keyword.get(opts, :normalization, :none)
    standard = Keyword.get(opts, :standard, :none)

    unless is_map(codes) and
             Enum.all?(codes, fn {code, id} -> is_binary(code) and is_integer(id) end) and
             map_size(codes) == codes |> Map.values() |> Enum.uniq() |> length() do
      raise ArgumentError, "reference codes must map unique strings to unique integer ids"
    end

    unless normalization in [:none, :lower, :upper] do
      raise ArgumentError, "reference code normalization must be :none, :lower, or :upper"
    end

    unless standard in [:none, :territory, :language] do
      raise ArgumentError, "reference code standard must be :none, :territory, or :language"
    end

    %{
      codes: codes,
      ids: Map.new(codes, fn {code, id} -> {id, code} end),
      normalization: normalization,
      standard: standard
    }
  end

  @impl true
  def type(_params), do: :integer

  @impl true
  def cast(nil, _params), do: {:ok, nil}
  def cast(code, params) when is_atom(code), do: code |> Atom.to_string() |> cast(params)

  def cast(code, %{codes: codes, normalization: normalization, standard: standard})
      when is_binary(code) do
    with {:ok, code} <- canonicalize(code, standard),
         code <- normalize(code, normalization),
         true <- Map.has_key?(codes, code) do
      {:ok, code}
    else
      _error -> :error
    end
  end

  def cast(_code, _params), do: :error

  @impl true
  def dump(nil, _dumper, _params), do: {:ok, nil}

  def dump(code, _dumper, %{codes: codes} = params) do
    with {:ok, code} <- cast(code, params),
         id when is_integer(id) <- Map.get(codes, code) do
      {:ok, id}
    else
      _unknown_code -> :error
    end
  end

  @impl true
  def load(nil, _loader, _params), do: {:ok, nil}

  def load(id, _loader, %{ids: ids}) when is_integer(id), do: Map.fetch(ids, id)

  def load(_id, _loader, _params), do: :error

  @spec normalize(term(), map(), :none | :lower | :upper) :: String.t() | nil
  def normalize(value, codes, normalization), do: normalize(value, codes, normalization, :none)

  @spec normalize(term(), map(), :none | :lower | :upper, :none | :territory | :language) ::
          String.t() | nil
  def normalize(value, codes, normalization, standard) do
    params = %{codes: codes, normalization: normalization, standard: standard}

    case cast(value, params) do
      {:ok, code} -> code
      :error -> nil
    end
  end

  defp normalize(code, :none), do: String.trim(code)
  defp normalize(code, :lower), do: code |> String.trim() |> String.downcase()
  defp normalize(code, :upper), do: code |> String.trim() |> String.upcase()

  defp canonicalize(code, :none), do: {:ok, code}
  defp canonicalize(code, :territory), do: ReferenceData.canonical_territory(code)
  defp canonicalize(code, :language), do: ReferenceData.canonical_language(code)
end
