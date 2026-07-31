defmodule ProductCompareSchemas.Pricing.MerchantProduct do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.CurrencyCode

  @type t :: %__MODULE__{}

  schema "merchant_products" do
    field :entropy_id, Ecto.UUID
    field :external_sku, :string
    field :url, :string
    field :currency, CurrencyCode, source: :currency_id
    field :last_seen_at, :utc_datetime_usec
    field :is_active, :boolean

    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :product, ProductCompareSchemas.Catalog.Product

    has_many :price_points, ProductCompareSchemas.Pricing.PricePoint

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(merchant_product, attrs) do
    merchant_product
    |> cast(attrs, [
      :merchant_id,
      :product_id,
      :external_sku,
      :url,
      :currency,
      :last_seen_at,
      :is_active
    ])
    |> validate_required([:merchant_id, :product_id, :url, :currency])
    |> unique_constraint([:merchant_id, :url], name: :merchant_products_merchant_url_uq)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:currency, name: :merchant_products_currency_id_fkey)
    |> check_constraint(:base,
      name: :merchant_products_identity_immutable,
      message: "merchant offer identity is immutable"
    )
  end
end
