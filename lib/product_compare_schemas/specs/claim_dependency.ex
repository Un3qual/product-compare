defmodule ProductCompareSchemas.Specs.ClaimDependency do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "claim_dependencies" do
    field :entropy_id, Ecto.UUID

    belongs_to :claim, ProductCompareSchemas.Specs.ProductAttributeClaim
    belongs_to :depends_on_claim, ProductCompareSchemas.Specs.ProductAttributeClaim

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(claim_dependency, attrs) do
    claim_dependency
    |> cast(attrs, [:claim_id, :depends_on_claim_id])
    |> validate_required([:claim_id, :depends_on_claim_id])
    |> unique_constraint([:claim_id, :depends_on_claim_id], name: :claim_dependencies_uq)
  end
end
