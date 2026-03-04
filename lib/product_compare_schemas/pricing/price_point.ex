defmodule ProductCompareSchemas.Pricing.PricePoint do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "price_points" do
    field :entropy_id, Ecto.UUID
    field :observed_at, :utc_datetime_usec
    field :price, :decimal
    field :shipping, :decimal
    field :in_stock, :boolean

    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct
    belongs_to :artifact, ProductCompareSchemas.Specs.SourceArtifact

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(price_point, attrs) do
    price_point
    |> cast(attrs, [
      :merchant_product_id,
      :observed_at,
      :price,
      :shipping,
      :in_stock,
      :artifact_id
    ])
    |> validate_required([:merchant_product_id, :observed_at, :price])
    |> validate_number(:price, greater_than_or_equal_to: 0)
    |> validate_number(:shipping, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:merchant_product_id)
    |> foreign_key_constraint(:artifact_id)
  end
end
