defmodule ProductCompareSchemas.Specs.TaxonAttribute do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxon_attributes" do
    field :entropy_id, Ecto.UUID
    field :is_required, :boolean
    field :sort_order, :integer
    field :min_rep_to_edit, :integer

    belongs_to :taxon, ProductCompareSchemas.Taxonomy.Taxon
    belongs_to :attribute, ProductCompareSchemas.Specs.Attribute

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(taxon_attribute, attrs) do
    taxon_attribute
    |> cast(attrs, [:taxon_id, :attribute_id, :is_required, :sort_order, :min_rep_to_edit])
    |> validate_required([:taxon_id, :attribute_id])
    |> validate_number(:sort_order, greater_than_or_equal_to: 0)
    |> validate_number(:min_rep_to_edit, greater_than_or_equal_to: 0)
    |> unique_constraint([:taxon_id, :attribute_id], name: :taxon_attributes_taxon_attr_uq)
    |> foreign_key_constraint(:taxon_id)
    |> foreign_key_constraint(:attribute_id)
  end
end
