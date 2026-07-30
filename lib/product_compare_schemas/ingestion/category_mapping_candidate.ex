defmodule ProductCompareSchemas.Ingestion.CategoryMappingCandidate do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "category_mapping_candidates" do
    field :entropy_id, Ecto.UUID
    field :display_path, :string
    field :normalized_path, :string
    field :status, Ecto.Enum, values: [:pending, :mapped, :dismissed], default: :pending
    field :observation_count, :integer, default: 1
    field :last_seen_at, :utc_datetime_usec

    belongs_to :source, ProductCompareSchemas.Specs.Source
    belongs_to :taxon, ProductCompareSchemas.Taxonomy.Taxon

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(candidate, attrs) do
    candidate
    |> cast(attrs, [
      :source_id,
      :taxon_id,
      :display_path,
      :normalized_path,
      :status,
      :observation_count,
      :last_seen_at
    ])
    |> validate_required([
      :source_id,
      :display_path,
      :normalized_path,
      :status,
      :observation_count,
      :last_seen_at
    ])
    |> validate_number(:observation_count, greater_than: 0)
    |> unique_constraint([:source_id, :normalized_path],
      name: :category_mapping_candidates_source_path_uq
    )
    |> foreign_key_constraint(:source_id)
    |> foreign_key_constraint(:taxon_id)
  end
end
