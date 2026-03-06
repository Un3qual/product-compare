defmodule ProductCompareSchemas.Accounts.User do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "users" do
    field :entropy_id, Ecto.UUID
    field :email, :string
    field :hashed_password, :string

    has_one :reputation, ProductCompareSchemas.Accounts.UserReputation
    has_many :reputation_events, ProductCompareSchemas.Accounts.ReputationEvent
    has_many :api_tokens, ProductCompareSchemas.Accounts.ApiToken

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :hashed_password])
    |> validate_required([:email, :hashed_password])
    |> update_change(:email, &String.downcase/1)
    |> unique_constraint(:email)
  end
end
