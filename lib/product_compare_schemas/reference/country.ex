defmodule ProductCompareSchemas.Reference.Country do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer
  @codes %{"CA" => 124, "US" => 840}

  @type t :: %__MODULE__{}

  schema "countries" do
    field :code, :string
    field :numeric_code, :string
    field :name, :string

    timestamps()
  end

  @spec codes() :: %{String.t() => pos_integer()}
  def codes, do: @codes

  @spec normalize_code(term()) :: String.t() | nil
  def normalize_code(value), do: ReferenceCode.normalize(value, @codes, :upper)
end
