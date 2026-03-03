defmodule ProductCompareSchemas.Catalog.Brand do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "brands" do
    field :entropy_id, Ecto.UUID
    field :name, :string

    has_many :products, ProductCompareSchemas.Catalog.Product

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(brand, attrs) do
    brand
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
