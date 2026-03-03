defmodule ProductCompareSchemas.Taxonomy.TaxonAlias do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxon_aliases" do
    field :entropy_id, Ecto.UUID
    field :alias, :string

    belongs_to :taxon, ProductCompareSchemas.Taxonomy.Taxon

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(taxon_alias, attrs) do
    taxon_alias
    |> cast(attrs, [:taxon_id, :alias])
    |> validate_required([:taxon_id, :alias])
    |> unique_constraint(:alias, name: :taxon_aliases_alias_uq)
  end
end
