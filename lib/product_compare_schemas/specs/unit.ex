defmodule ProductCompareSchemas.Specs.Unit do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.FiniteDecimal

  @type t :: %__MODULE__{}

  schema "units" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :symbol, :string
    field :multiplier_to_base, FiniteDecimal
    field :offset_to_base, FiniteDecimal

    belongs_to :dimension, ProductCompareSchemas.Specs.Dimension

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(unit, attrs) do
    unit
    |> cast(attrs, [:dimension_id, :code, :symbol, :multiplier_to_base, :offset_to_base])
    |> validate_required([:dimension_id, :code, :multiplier_to_base, :offset_to_base])
    |> unique_constraint([:dimension_id, :code], name: :units_dimension_code_uq)
    |> validate_number(:multiplier_to_base, not_equal_to: 0, message: "must not be zero")
    |> check_constraint(:multiplier_to_base, name: :units_multiplier_to_base_nonzero)
    |> foreign_key_constraint(:dimension_id)
    |> check_constraint(:base,
      name: :units_semantics_immutable,
      message: "unit conversion semantics are immutable"
    )
  end
end
