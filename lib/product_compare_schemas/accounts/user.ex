defmodule ProductCompareSchemas.Accounts.User do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "users" do
    field :entropy_id, Ecto.UUID
    field :email, :string
    field :hashed_password, :string, redact: true
    field :confirmed_at, :utc_datetime_usec
    field :password, :string, virtual: true, redact: true

    has_one :reputation, ProductCompareSchemas.Accounts.UserReputation
    has_many :reputation_events, ProductCompareSchemas.Accounts.ReputationEvent
    has_many :api_tokens, ProductCompareSchemas.Accounts.ApiToken

    has_many :session_tokens, ProductCompareSchemas.Accounts.UserSessionToken,
      foreign_key: :user_id

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :hashed_password, :confirmed_at])
    |> validate_required([:email, :hashed_password])
    |> update_change(:email, &String.downcase/1)
    |> unique_constraint(:email)
  end

  @spec registration_changeset(t(), map()) :: Ecto.Changeset.t()
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password])
    |> validate_required([:email, :password])
    |> validate_length(:password, min: 12, max: 72)
    |> update_change(:email, &String.downcase/1)
    |> put_hashed_password()
    |> unique_constraint(:email)
  end

  defp put_hashed_password(%Ecto.Changeset{valid?: false} = changeset), do: changeset

  defp put_hashed_password(changeset) do
    put_change(
      changeset,
      :hashed_password,
      Argon2.hash_pwd_salt(get_change(changeset, :password))
    )
  end
end
