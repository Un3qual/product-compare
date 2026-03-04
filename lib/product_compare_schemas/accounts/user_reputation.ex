defmodule ProductCompareSchemas.Accounts.UserReputation do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "user_reputation" do
    field :entropy_id, Ecto.UUID
    field :points, :integer

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(reputation, attrs) do
    reputation
    |> cast(attrs, [:user_id, :points])
    |> validate_required([:user_id, :points])
    |> unique_constraint(:user_id)
  end
end
