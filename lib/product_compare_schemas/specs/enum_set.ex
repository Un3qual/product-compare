defmodule ProductCompareSchemas.Specs.EnumSet do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "enum_sets" do
    field :entropy_id, Ecto.UUID
    field :code, :string

    has_many :options, ProductCompareSchemas.Specs.EnumOption

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(enum_set, attrs) do
    enum_set
    |> cast(attrs, [:code])
    |> validate_required([:code])
    |> unique_constraint(:code)
  end
end
