defmodule ProductCompareSchemas.Catalog.Product do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "products" do
    field :entropy_id, Ecto.UUID
    field :name, :string
    field :model_number, :string
    field :slug, :string
    field :description, :string

    belongs_to :brand, ProductCompareSchemas.Catalog.Brand
    belongs_to :primary_type_taxon, ProductCompareSchemas.Taxonomy.Taxon

    has_many :claims, ProductCompareSchemas.Specs.ProductAttributeClaim
    has_many :current_claims, ProductCompareSchemas.Specs.ProductAttributeCurrent
    has_many :identifiers, ProductCompareSchemas.Catalog.ProductIdentifier
    has_many :media, ProductCompareSchemas.Catalog.ProductMedia
    has_many :slug_aliases, ProductCompareSchemas.Catalog.ProductSlugAlias

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(product, attrs) do
    product
    |> cast(attrs, [:brand_id, :primary_type_taxon_id, :name, :model_number, :slug, :description])
    |> validate_required([:name, :slug])
    |> validate_format(:slug, ~r/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
    |> check_constraint(:slug, name: :products_slug_format_check)
    |> unique_constraint(:slug)
    |> unique_constraint(:slug, name: :product_slug_namespace_uq)
    |> foreign_key_constraint(:brand_id)
    |> foreign_key_constraint(:primary_type_taxon_id)
  end
end
