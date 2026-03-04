defmodule ProductCompareSchemas.Affiliate.AffiliateLink do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "affiliate_links" do
    field :entropy_id, Ecto.UUID
    field :original_url, :string
    field :affiliate_url, :string
    field :last_verified_at, :utc_datetime_usec

    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct
    belongs_to :affiliate_network, ProductCompareSchemas.Affiliate.AffiliateNetwork

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(link, attrs) do
    link
    |> cast(attrs, [
      :merchant_product_id,
      :affiliate_network_id,
      :original_url,
      :affiliate_url,
      :last_verified_at
    ])
    |> validate_required([:merchant_product_id, :original_url, :affiliate_url])
    |> unique_constraint(:merchant_product_id, name: :affiliate_links_merchant_product_uq)
    |> foreign_key_constraint(:merchant_product_id)
    |> foreign_key_constraint(:affiliate_network_id)
  end
end
