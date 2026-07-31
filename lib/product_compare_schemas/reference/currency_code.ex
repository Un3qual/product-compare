defmodule ProductCompareSchemas.Reference.CurrencyCode do
  @moduledoc """
  Maps public ISO 4217 alphabetic codes to the numeric identifiers stored by
  `currencies.id`.
  """

  use Ecto.Type

  @codes %{
    "CAD" => 124,
    "GBP" => 826,
    "USD" => 840,
    "EUR" => 978
  }
  @ids Map.new(@codes, fn {code, id} -> {id, code} end)

  @impl true
  def type, do: :integer

  @impl true
  def cast(code) when is_binary(code) do
    code = code |> String.trim() |> String.upcase()
    if Map.has_key?(@codes, code), do: {:ok, code}, else: :error
  end

  def cast(_code), do: :error

  @impl true
  def dump(code) do
    with {:ok, code} <- cast(code),
         id when is_integer(id) <- Map.get(@codes, code) do
      {:ok, id}
    else
      _unknown_code -> :error
    end
  end

  @impl true
  def load(id) when is_integer(id), do: Map.fetch(@ids, id)

  def load(_id), do: :error
end
