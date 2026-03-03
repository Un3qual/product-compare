defmodule ProductCompareSchemas.Specs.DerivedFormulaDep do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "derived_formula_deps" do
    field :entropy_id, Ecto.UUID

    belongs_to :formula, ProductCompareSchemas.Specs.DerivedFormula
    belongs_to :depends_on_attribute, ProductCompareSchemas.Specs.Attribute

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(dep, attrs) do
    dep
    |> cast(attrs, [:formula_id, :depends_on_attribute_id])
    |> validate_required([:formula_id, :depends_on_attribute_id])
    |> unique_constraint([:formula_id, :depends_on_attribute_id], name: :derived_formula_deps_uq)
  end
end
