defmodule ProductCompareSchemas.Specs.SourceKind do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer
  @codes %{
    "affiliate_feed" => 1,
    "merchant_feed" => 2,
    "manufacturer" => 3,
    "web" => 4,
    "feed" => 5,
    "affiliate" => 6
  }

  @type t :: %__MODULE__{}

  schema "source_kinds" do
    field :code, :string
    field :name, :string

    timestamps()
  end

  @spec codes() :: %{String.t() => pos_integer()}
  def codes, do: @codes

  @spec normalize_code(term()) :: String.t() | nil
  def normalize_code(value), do: ReferenceCode.normalize(value, @codes, :lower)
end
