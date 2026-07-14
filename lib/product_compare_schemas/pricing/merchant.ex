defmodule ProductCompareSchemas.Pricing.Merchant do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "merchants" do
    field :entropy_id, Ecto.UUID
    field :name, :string
    field :domain, :string
    field :slug, :string

    has_many :merchant_products, ProductCompareSchemas.Pricing.MerchantProduct

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(merchant, attrs) do
    merchant
    |> cast(attrs, [:name, :domain, :slug])
    |> validate_required([:name, :domain, :slug])
    |> validate_format(:slug, ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    |> unique_constraint(:name)
    |> unique_constraint(:domain)
    |> unique_constraint(:slug)
  end
end
