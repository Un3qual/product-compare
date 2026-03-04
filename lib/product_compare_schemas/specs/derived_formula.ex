defmodule ProductCompareSchemas.Specs.DerivedFormula do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "derived_formulas" do
    field :entropy_id, Ecto.UUID
    field :lang, :string
    field :expression, :string

    belongs_to :attribute, ProductCompareSchemas.Specs.Attribute

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(formula, attrs) do
    formula
    |> cast(attrs, [:attribute_id, :lang, :expression])
    |> validate_required([:attribute_id, :lang, :expression])
    |> unique_constraint(:attribute_id, name: :derived_formulas_attribute_uq)
  end
end
