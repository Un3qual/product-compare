defmodule ProductCompareSchemas.Taxonomy.ProductTaxon do
  use ProductCompareSchemas.Schema, :relational

  @source_types [:scrape, :user, :derived, :editorial]

  @type t :: %__MODULE__{}
  @type source_type :: :scrape | :user | :derived | :editorial

  schema "product_taxons" do
    field :entropy_id, Ecto.UUID
    field :source_type, Ecto.Enum, values: @source_types
    field :confidence, :decimal

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :taxon, ProductCompareSchemas.Taxonomy.Taxon
    belongs_to :creator, ProductCompareSchemas.Accounts.User, foreign_key: :created_by

    timestamps(updated_at: false)
  end

  @spec source_types() :: [atom()]
  def source_types, do: @source_types

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(product_taxon, attrs) do
    product_taxon
    |> cast(attrs, [:product_id, :taxon_id, :source_type, :confidence, :created_by])
    |> validate_required([:product_id, :taxon_id, :source_type])
    |> validate_number(:confidence, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> unique_constraint([:product_id, :taxon_id], name: :product_taxons_product_taxon_uq)
  end
end
