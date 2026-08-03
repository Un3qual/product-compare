defmodule ProductCompareSchemas.Specs.SourceArtifact do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}
  @required_fields [:source_id, :fetched_at]

  schema "source_artifacts" do
    field :entropy_id, Ecto.UUID
    field :url, :string
    field :fetched_at, :utc_datetime_usec
    field :content_hash, :binary
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
    |> validate_sha256_digest(:content_hash)
    |> foreign_key_constraint(:source_id)
    |> check_constraint(:content_hash, name: :source_artifacts_content_hash_sha256_length)
    |> unique_constraint([:source_id, :content_hash],
      name: :source_artifacts_source_content_hash_uq
    )
  end

  defp validate_sha256_digest(changeset, field) do
    validate_change(changeset, field, fn ^field, value ->
      if is_binary(value) and byte_size(value) == 32, do: [], else: [{field, "must be 32 bytes"}]
    end)
  end
end
