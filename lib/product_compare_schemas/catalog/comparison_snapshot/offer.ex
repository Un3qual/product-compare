defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Offer do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.FiniteDecimal
  alias ProductCompareSchemas.Reference.CurrencyCode

  @freshness_values [:fresh, :aging, :stale, :unobserved]
  @type t :: %__MODULE__{}

  schema "comparison_snapshot_offers" do
    field :position, :integer
    field :merchant_product_id, :integer
    field :price_point_id, :integer
    field :merchant_name, :string
    field :merchant_domain, :string
    field :currency, CurrencyCode, source: :currency_id
    field :item_price, FiniteDecimal
    field :shipping, FiniteDecimal
    field :landed_price, FiniteDecimal
    field :observed_at, :utc_datetime_usec
    field :freshness, Ecto.Enum, values: @freshness_values

    belongs_to :snapshot_product, ProductCompareSchemas.Catalog.ComparisonSnapshot.Product
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(offer, attrs) do
    offer
    |> cast(attrs, [
      :snapshot_product_id,
      :position,
      :merchant_product_id,
      :price_point_id,
      :merchant_name,
      :merchant_domain,
      :currency,
      :item_price,
      :shipping,
      :landed_price,
      :observed_at,
      :freshness
    ])
    |> validate_required([
      :snapshot_product_id,
      :position,
      :merchant_product_id,
      :price_point_id,
      :merchant_name,
      :currency,
      :item_price,
      :shipping,
      :landed_price,
      :observed_at,
      :freshness
    ])
    |> validate_number(:position, greater_than: 0)
    |> validate_number(:item_price, greater_than_or_equal_to: 0)
    |> validate_number(:shipping, greater_than_or_equal_to: 0)
    |> validate_number(:landed_price, greater_than_or_equal_to: 0)
    |> unique_constraint([:snapshot_product_id, :position],
      name: :snapshot_offers_product_position_uq
    )
    |> foreign_key_constraint(:snapshot_product_id)
    |> foreign_key_constraint(:currency, name: :comparison_snapshot_offers_currency_id_fkey)
    |> check_constraint(:position, name: :comparison_snapshot_offers_position)
    |> check_constraint(:item_price,
      name: :comparison_snapshot_offers_amounts_non_negative
    )
  end
end
