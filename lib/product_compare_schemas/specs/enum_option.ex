defmodule ProductCompareSchemas.Specs.EnumOption do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "enum_options" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :label, :string
    field :sort_order, :integer

    belongs_to :enum_set, ProductCompareSchemas.Specs.EnumSet

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(option, attrs) do
    option
    |> cast(attrs, [:enum_set_id, :code, :label, :sort_order])
    |> validate_required([:enum_set_id, :code, :label])
    |> unique_constraint([:enum_set_id, :code], name: :enum_options_set_code_uq)
  end
end
