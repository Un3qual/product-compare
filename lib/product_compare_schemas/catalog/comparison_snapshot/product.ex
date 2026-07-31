defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Product do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "comparison_snapshot_products" do
    field :position, :integer
    field :product_id, :integer
    field :name, :string
    field :slug, :string
    field :description, :string
    field :model_number, :string
    field :brand_name, :string

    belongs_to :comparison_snapshot, ProductCompareSchemas.Catalog.ComparisonSnapshot

    has_many :attributes, ProductCompareSchemas.Catalog.ComparisonSnapshot.Attribute,
      foreign_key: :snapshot_product_id

    has_many :offers, ProductCompareSchemas.Catalog.ComparisonSnapshot.Offer,
      foreign_key: :snapshot_product_id
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(product, attrs) do
    product
    |> cast(attrs, [
      :comparison_snapshot_id,
      :position,
      :product_id,
      :name,
      :slug,
      :description,
      :model_number,
      :brand_name
    ])
    |> validate_required([:comparison_snapshot_id, :position, :product_id, :name, :slug])
    |> validate_number(:position, greater_than: 0)
    |> unique_constraint([:comparison_snapshot_id, :position],
      name: :snapshot_products_snapshot_position_uq
    )
    |> unique_constraint([:comparison_snapshot_id, :product_id],
      name: :snapshot_products_snapshot_product_uq
    )
    |> foreign_key_constraint(:comparison_snapshot_id)
    |> check_constraint(:position, name: :comparison_snapshot_products_position)
  end
end
