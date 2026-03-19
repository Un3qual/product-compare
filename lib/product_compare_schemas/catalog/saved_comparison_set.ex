defmodule ProductCompareSchemas.Catalog.SavedComparisonSet do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Catalog.SavedComparisonItem

  @type t :: %__MODULE__{}

  schema "saved_comparison_sets" do
    field :entropy_id, Ecto.UUID
    field :name, :string

    belongs_to :user, ProductCompareSchemas.Accounts.User

    has_many :items, SavedComparisonItem,
      foreign_key: :saved_comparison_set_id,
      preload_order: [asc: :position]

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(saved_comparison_set, attrs) do
    saved_comparison_set
    |> cast(attrs, [:user_id, :name])
    |> validate_required([:user_id, :name])
    |> validate_length(:name, min: 1, max: 120)
    |> assoc_constraint(:user)
  end
end
