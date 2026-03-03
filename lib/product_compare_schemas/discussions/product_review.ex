defmodule ProductCompareSchemas.Discussions.ProductReview do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_reviews" do
    field :entropy_id, Ecto.UUID
    field :rating, :integer
    field :title, :string
    field :body_md, :string
    field :verified_purchase, :boolean

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(review, attrs) do
    review
    |> cast(attrs, [
      :product_id,
      :user_id,
      :merchant_product_id,
      :rating,
      :title,
      :body_md,
      :verified_purchase
    ])
    |> validate_required([:product_id, :user_id, :rating])
    |> validate_number(:rating, greater_than_or_equal_to: 1, less_than_or_equal_to: 5)
    |> unique_constraint([:product_id, :user_id], name: :product_reviews_product_user_uq)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:merchant_product_id)
  end
end
