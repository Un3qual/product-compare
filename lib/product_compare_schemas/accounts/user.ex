defmodule ProductCompareSchemas.Accounts.User do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}
  @email_format ~r/^[^\s]+@[^\s]+$/

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

  @spec normalize_email(String.t()) :: String.t()
  def normalize_email(email) when is_binary(email) do
    email
    |> String.trim()
    |> String.downcase()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :hashed_password, :confirmed_at])
    |> validate_required([:email, :hashed_password])
    |> update_change(:email, &normalize_email/1)
    |> validate_format(:email, @email_format, message: "must have the @ sign and no spaces")
    |> unique_constraint(:email)
  end

  @spec registration_changeset(t(), map()) :: Ecto.Changeset.t()
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password])
    |> validate_required([:email, :password])
    |> validate_length(:password, min: 12, max: 72)
    |> update_change(:email, &normalize_email/1)
    |> validate_format(:email, @email_format, message: "must have the @ sign and no spaces")
    |> put_hashed_password()
    |> unique_constraint(:email)
  end

  @spec password_changeset(t(), map()) :: Ecto.Changeset.t()
  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_length(:password, min: 12, max: 72)
    |> put_hashed_password()
  end

  @spec confirm_changeset(t()) :: Ecto.Changeset.t()
  def confirm_changeset(%__MODULE__{} = user) do
    confirmed_at = user.confirmed_at || DateTime.utc_now() |> DateTime.truncate(:microsecond)
    change(user, confirmed_at: confirmed_at)
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
