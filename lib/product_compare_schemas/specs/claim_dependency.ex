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
    |> validate_not_self_dependency()
    |> unique_constraint([:claim_id, :depends_on_claim_id], name: :claim_dependencies_uq)
    |> foreign_key_constraint(:claim_id)
    |> foreign_key_constraint(:depends_on_claim_id)
  end

  defp validate_not_self_dependency(changeset) do
    if get_field(changeset, :claim_id) == get_field(changeset, :depends_on_claim_id) do
      add_error(changeset, :depends_on_claim_id, "must not reference the same claim")
    else
      changeset
    end
  end
end
