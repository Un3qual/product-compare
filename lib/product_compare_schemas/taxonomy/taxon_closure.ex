defmodule ProductCompareSchemas.Taxonomy.TaxonClosure do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxon_closure" do
    field :entropy_id, Ecto.UUID
    field :depth, :integer

    belongs_to :ancestor, ProductCompareSchemas.Taxonomy.Taxon
    belongs_to :descendant, ProductCompareSchemas.Taxonomy.Taxon

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(closure, attrs) do
    closure
    |> cast(attrs, [:ancestor_id, :descendant_id, :depth])
    |> validate_required([:ancestor_id, :descendant_id, :depth])
    |> validate_number(:depth, greater_than_or_equal_to: 0)
    |> unique_constraint([:ancestor_id, :descendant_id], name: :taxon_closure_anc_desc_uq)
  end
end
