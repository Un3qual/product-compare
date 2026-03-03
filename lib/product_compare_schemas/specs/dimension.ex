defmodule ProductCompareSchemas.Specs.Dimension do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "dimensions" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :description, :string

    has_many :units, ProductCompareSchemas.Specs.Unit
    has_many :attributes, ProductCompareSchemas.Specs.Attribute

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(dimension, attrs) do
    dimension
    |> cast(attrs, [:code, :description])
    |> validate_required([:code])
    |> unique_constraint(:code)
  end
end
