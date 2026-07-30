defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Evidence do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.ReferenceCode
  alias ProductCompareSchemas.Specs.Source

  @type t :: %__MODULE__{}

  schema "comparison_snapshot_evidence" do
    field :position, :integer
    field :artifact_id, :integer
    field :excerpt, :string

    field :source_kind, ReferenceCode,
      codes: Source.kind_codes(),
      normalization: :lower,
      source: :source_kind_id

    field :source_name, :string
    field :source_domain, :string
    field :url, :string
    field :fetched_at, :utc_datetime_usec

    belongs_to :snapshot_attribute, ProductCompareSchemas.Catalog.ComparisonSnapshot.Attribute
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(evidence, attrs) do
    evidence
    |> cast(attrs, [
      :snapshot_attribute_id,
      :position,
      :artifact_id,
      :excerpt,
      :source_kind,
      :source_name,
      :source_domain,
      :url,
      :fetched_at
    ])
    |> validate_required([
      :snapshot_attribute_id,
      :position,
      :artifact_id,
      :source_kind,
      :source_name,
      :fetched_at
    ])
    |> validate_number(:position, greater_than: 0)
    |> unique_constraint([:snapshot_attribute_id, :position],
      name: :snapshot_evidence_attribute_position_uq
    )
    |> foreign_key_constraint(:snapshot_attribute_id)
    |> foreign_key_constraint(:source_kind,
      name: :comparison_snapshot_evidence_source_kind_id_fkey
    )
    |> check_constraint(:position, name: :comparison_snapshot_evidence_position)
  end
end
