defmodule ProductCompareSchemas.Discussions.CommunityWriteReceipt do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "community_write_receipts" do
    field :idempotency_key, :string
    field :payload_digest, :binary
    field :content_type, Ecto.Enum, values: [:review, :question, :answer]
    field :content_entropy_id, Ecto.UUID

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(receipt, attrs) do
    receipt
    |> cast(attrs, [
      :user_id,
      :idempotency_key,
      :payload_digest,
      :content_type,
      :content_entropy_id
    ])
    |> validate_required([
      :user_id,
      :idempotency_key,
      :payload_digest,
      :content_type,
      :content_entropy_id
    ])
    |> validate_length(:idempotency_key, min: 16, max: 128)
    |> validate_format(:idempotency_key, ~r/^[\x20-\x7E]+$/)
    |> validate_change(:payload_digest, fn :payload_digest, digest ->
      if byte_size(digest) == 32, do: [], else: [payload_digest: "must be a SHA-256 digest"]
    end)
    |> unique_constraint([:user_id, :content_type, :idempotency_key],
      name: :community_write_receipts_user_content_key_uq,
      error_key: :idempotency_key
    )
    |> check_constraint(:idempotency_key, name: :community_write_receipts_key_check)
    |> check_constraint(:payload_digest, name: :community_write_receipts_digest_check)
    |> foreign_key_constraint(:user_id)
  end
end
