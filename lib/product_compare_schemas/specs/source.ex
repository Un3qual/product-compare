defmodule ProductCompareSchemas.Specs.Source do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Ingestion.IntegrationProvider
  alias ProductCompareSchemas.Reference.ReferenceCode
  alias ProductCompareSchemas.Specs.SourceKind

  @type t :: %__MODULE__{}

  schema "sources" do
    field :entropy_id, Ecto.UUID

    field :kind, ReferenceCode,
      codes: SourceKind.codes(),
      normalization: :lower,
      source: :source_kind_id

    field :provider, ReferenceCode,
      codes: IntegrationProvider.codes(),
      normalization: :lower,
      source: :provider_id

    field :name, :string
    field :domain, :string

    has_many :artifacts, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(source, attrs) do
    source
    |> cast(attrs, [:kind, :provider, :name, :domain])
    |> validate_required([:kind, :name])
    |> unique_constraint([:kind, :name], name: :sources_kind_name_uq)
    |> foreign_key_constraint(:kind, name: :sources_source_kind_id_fkey)
    |> foreign_key_constraint(:provider, name: :sources_provider_id_fkey)
  end
end
