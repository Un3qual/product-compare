defmodule ProductCompareSchemas.Specs.SourceArtifact do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}
  @required_fields [:source_id, :fetched_at]

  schema "source_artifacts" do
    field :entropy_id, Ecto.UUID
    field :url, :string
    field :fetched_at, :utc_datetime_usec
    field :content_hash, :string
    field :raw_json, :map
    field :raw_text, :string

    belongs_to :source, ProductCompareSchemas.Specs.Source

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(artifact, attrs) do
    artifact
    |> cast(attrs, [:source_id, :url, :fetched_at, :content_hash, :raw_json, :raw_text])
    |> validate_required(@required_fields)
    |> foreign_key_constraint(:source_id)
  end
end
