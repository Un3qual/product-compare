defmodule ProductCompareSchemas.Catalog.ProductSlugAlias do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_slug_aliases" do
    field :entropy_id, Ecto.UUID
    field :slug, :string

    belongs_to :product, ProductCompareSchemas.Catalog.Product

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(alias_record, attrs) do
    alias_record
    |> cast(attrs, [:slug, :product_id])
    |> validate_required([:slug, :product_id])
    |> validate_format(:slug, ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    |> unique_constraint(:slug)
    |> foreign_key_constraint(:product_id)
  end
end
