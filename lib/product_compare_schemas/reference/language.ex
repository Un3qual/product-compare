defmodule ProductCompareSchemas.Reference.Language do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer
  @codes %{"EN" => 1, "FR" => 2}

  @type t :: %__MODULE__{}

  schema "languages" do
    field :code, :string
    field :name, :string

    timestamps()
  end

  @spec codes() :: %{String.t() => pos_integer()}
  def codes, do: @codes

  @spec normalize_code(term()) :: String.t() | nil
  def normalize_code(value), do: ReferenceCode.normalize(value, @codes, :upper)
end
