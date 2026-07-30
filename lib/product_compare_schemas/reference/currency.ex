defmodule ProductCompareSchemas.Reference.Currency do
  use ProductCompareSchemas.Schema, :relational

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer

  @type t :: %__MODULE__{}

  schema "currencies" do
    field :code, :string
    field :numeric_code, :string
    field :minor_unit, :integer
    field :name, :string

    timestamps()
  end
end
