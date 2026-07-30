defmodule ProductCompareSchemas.Affiliate.AffiliateProgramStatusCode do
  @moduledoc false

  use Ecto.Type

  @codes %{"active" => 1, "paused" => 2}
  @ids Map.new(@codes, fn {code, id} -> {id, code} end)

  @impl true
  def type, do: :integer

  @impl true
  def cast(code) when is_atom(code), do: code |> Atom.to_string() |> cast()

  def cast(code) when is_binary(code) do
    code = code |> String.trim() |> String.downcase()
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
  def load(id) when is_integer(id) do
    case Map.fetch(@ids, id) do
      {:ok, code} -> {:ok, code}
      :error -> :error
    end
  end

  def load(_id), do: :error
end
