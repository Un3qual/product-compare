defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "comparison_snapshots" do
    field :entropy_id, Ecto.UUID
    field :public_token, :string
    field :title, :string
    field :payload, :map
    field :revoked_at, :utc_datetime_usec
    field :search_indexable, :boolean, default: false
    field :search_qualified, :boolean, default: false

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec publish_changeset(t(), map()) :: Ecto.Changeset.t()
  def publish_changeset(snapshot, attrs) do
    snapshot
    |> cast(attrs, [
      :public_token,
      :user_id,
      :title,
      :payload,
      :search_indexable,
      :search_qualified
    ])
    |> validate_required([:public_token, :user_id, :payload])
    |> validate_length(:public_token, is: 43)
    |> validate_format(:public_token, ~r/^[A-Za-z0-9_-]+$/)
    |> validate_length(:title, min: 1, max: 120)
    |> unique_constraint(:public_token)
    |> assoc_constraint(:user)
  end

  @spec revoke_changeset(t(), DateTime.t()) :: Ecto.Changeset.t()
  def revoke_changeset(snapshot, revoked_at), do: change(snapshot, revoked_at: revoked_at)
end
