defmodule ProductCompareSchemas.Specs.Unit do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "units" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :symbol, :string
    field :multiplier_to_base, :decimal
    field :offset_to_base, :decimal

    belongs_to :dimension, ProductCompareSchemas.Specs.Dimension

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(unit, attrs) do
    unit
    |> cast(attrs, [:dimension_id, :code, :symbol, :multiplier_to_base, :offset_to_base])
    |> validate_required([:dimension_id, :code, :multiplier_to_base, :offset_to_base])
    |> unique_constraint([:dimension_id, :code], name: :units_dimension_code_uq)
    |> validate_change(:multiplier_to_base, fn :multiplier_to_base, multiplier ->
      if Decimal.equal?(multiplier, Decimal.new(0)) do
        [multiplier_to_base: {"must not be zero", [validation: :non_zero]}]
      else
        []
      end
    end)
  end
end
