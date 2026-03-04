defmodule ProductCompareSchemas.Specs.ClaimEvidence do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "claim_evidence" do
    field :entropy_id, Ecto.UUID
    field :excerpt, :string

    belongs_to :claim, ProductCompareSchemas.Specs.ProductAttributeClaim
    belongs_to :artifact, ProductCompareSchemas.Specs.SourceArtifact

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(claim_evidence, attrs) do
    claim_evidence
    |> cast(attrs, [:claim_id, :artifact_id, :excerpt])
    |> validate_required([:claim_id, :artifact_id])
    |> unique_constraint([:claim_id, :artifact_id], name: :claim_evidence_claim_artifact_uq)
  end
end
