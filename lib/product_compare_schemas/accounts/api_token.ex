defmodule ProductCompareSchemas.Accounts.ApiToken do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "api_tokens" do
    field :entropy_id, Ecto.UUID
    field :token_prefix, :string
    field :token_hash, :binary
    field :label, :string
    field :last_used_at, :utc_datetime_usec
    field :expires_at, :utc_datetime_usec
    field :revoked_at, :utc_datetime_usec

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(api_token, attrs) do
    api_token
    |> cast(attrs, [
      :user_id,
      :token_prefix,
      :token_hash,
      :label,
      :last_used_at,
      :expires_at,
      :revoked_at
    ])
    |> validate_required([:user_id, :token_prefix, :token_hash])
    |> validate_length(:token_prefix, min: 1, max: 32)
    |> validate_change(:token_hash, fn :token_hash, token_hash ->
      if is_binary(token_hash) and byte_size(token_hash) == 32 do
        []
      else
        [token_hash: "must be a 32-byte SHA3-256 digest"]
      end
    end)
    |> validate_length(:label, max: 120)
    |> check_constraint(:token_hash, name: :api_tokens_hash_length_check)
    |> unique_constraint(:token_hash)
    |> unique_constraint(:entropy_id)
    |> assoc_constraint(:user)
  end
end
