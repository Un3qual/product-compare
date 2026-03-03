defmodule ProductCompareSchemas.Specs.Source do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "sources" do
    field :entropy_id, Ecto.UUID
    field :kind, :string
    field :name, :string
    field :domain, :string

    has_many :artifacts, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(source, attrs) do
    source
    |> cast(attrs, [:kind, :name, :domain])
    |> validate_required([:kind, :name])
    |> unique_constraint([:kind, :name], name: :sources_kind_name_uq)
  end
end
