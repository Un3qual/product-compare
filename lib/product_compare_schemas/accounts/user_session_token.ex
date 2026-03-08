defmodule ProductCompareSchemas.Accounts.UserSessionToken do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  @primary_key {:id, Ecto.UUID, autogenerate: false, read_after_writes: true}

  schema "users_tokens" do
    field :token_hash, :binary
    field :context, :string
    field :sent_to, :string
    field :expires_at, :utc_datetime_usec

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(token, attrs) do
    token
    |> cast(attrs, [:user_id, :token_hash, :context, :sent_to, :expires_at])
    |> validate_required([:user_id, :token_hash, :context, :expires_at])
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:token_hash, :context], name: :users_tokens_hash_context_uq)
  end
end
