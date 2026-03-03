defmodule ProductCompareSchemas.Taxonomy.Taxonomy do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "taxonomies" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :name, :string

    has_many :taxons, ProductCompareSchemas.Taxonomy.Taxon

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(taxonomy, attrs) do
    taxonomy
    |> cast(attrs, [:code, :name])
    |> validate_required([:code, :name])
    |> unique_constraint(:code)
  end
end
