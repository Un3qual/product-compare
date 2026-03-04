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
    |> base_changeset(attrs)
    |> validate_verified_purchase_link()
  end

  @spec changeset_with_verified_purchase(t(), map(), boolean()) :: Ecto.Changeset.t()
  def changeset_with_verified_purchase(review, attrs, verified_purchase) do
    review
    |> base_changeset(attrs)
    |> put_change(:verified_purchase, verified_purchase)
    |> validate_verified_purchase_link()
  end

  defp base_changeset(review, attrs) do
    review
    |> cast(attrs, [:product_id, :user_id, :merchant_product_id, :rating, :title, :body_md])
    |> validate_required([:product_id, :user_id, :rating])
    |> validate_number(:rating, greater_than_or_equal_to: 1, less_than_or_equal_to: 5)
    |> unique_constraint([:product_id, :user_id], name: :product_reviews_product_user_uq)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:merchant_product_id)
  end

  defp validate_verified_purchase_link(changeset) do
    if get_field(changeset, :verified_purchase) == true and
         is_nil(get_field(changeset, :merchant_product_id)) do
      add_error(changeset, :merchant_product_id, "must be set when verified_purchase is true")
    else
      changeset
    end
  end
end
