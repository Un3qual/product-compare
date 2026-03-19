defmodule ProductCompareSchemas.Catalog.SavedComparisonItem do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "saved_comparison_items" do
    field :entropy_id, Ecto.UUID
    field :position, :integer

    belongs_to :saved_comparison_set, ProductCompareSchemas.Catalog.SavedComparisonSet
    belongs_to :product, ProductCompareSchemas.Catalog.Product

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(saved_comparison_item, attrs) do
    saved_comparison_item
    |> cast(attrs, [:saved_comparison_set_id, :product_id, :position])
    |> validate_required([:saved_comparison_set_id, :product_id, :position])
    |> validate_number(:position, greater_than_or_equal_to: 1, less_than_or_equal_to: 3)
    |> assoc_constraint(:saved_comparison_set)
    |> assoc_constraint(:product)
    |> unique_constraint(:position, name: :saved_comparison_items_set_position_uq)
    |> unique_constraint(:product_id, name: :saved_comparison_items_set_product_uq)
  end
end
