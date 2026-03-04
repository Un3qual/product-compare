defmodule ProductCompareSchemas.Taxonomy.Taxon do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxons" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :name, :string

    belongs_to :taxonomy, ProductCompareSchemas.Taxonomy.Taxonomy
    belongs_to :parent, __MODULE__

    has_many :children, __MODULE__, foreign_key: :parent_id
    has_many :aliases, ProductCompareSchemas.Taxonomy.TaxonAlias

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(taxon, attrs) do
    taxon
    |> cast(attrs, [:taxonomy_id, :parent_id, :code, :name])
    |> validate_required([:taxonomy_id, :code, :name])
    |> unique_constraint([:taxonomy_id, :code], name: :taxons_taxonomy_code_uq)
  end
end
