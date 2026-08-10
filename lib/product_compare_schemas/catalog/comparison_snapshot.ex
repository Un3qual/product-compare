defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "comparison_snapshots" do
    field :entropy_id, Ecto.UUID
    field :public_token, :string
    field :title, :string
    field :version, :integer
    field :captured_at, :utc_datetime_usec
    field :payload, :map, virtual: true
    field :revoked_at, :utc_datetime_usec
    field :search_indexable, :boolean, default: false
    field :search_qualified, :boolean, default: false

    belongs_to :user, ProductCompareSchemas.Accounts.User
    has_many :products, ProductCompareSchemas.Catalog.ComparisonSnapshot.Product
    has_one :recommendation, ProductCompareSchemas.Catalog.ComparisonSnapshot.Recommendation

    timestamps(updated_at: false)
  end

  @spec publish_changeset(t(), map()) :: Ecto.Changeset.t()
  def publish_changeset(snapshot, attrs) do
    snapshot
    |> cast(attrs, [
      :public_token,
      :user_id,
      :title,
      :version,
      :captured_at,
      :search_indexable
    ])
    |> validate_required([:public_token, :user_id, :version, :captured_at])
    |> validate_number(:version, greater_than: 0)
    |> validate_length(:public_token, is: 43)
    |> validate_format(:public_token, ~r/\A[A-Za-z0-9_-]+\z/)
    |> validate_length(:title, min: 1, max: 120)
    |> unique_constraint(:public_token)
    |> check_constraint(:public_token, name: :comparison_snapshots_public_token_format)
    |> check_constraint(:version, name: :comparison_snapshots_version_positive)
    |> assoc_constraint(:user)
  end

  @spec revoke_changeset(t(), DateTime.t()) :: Ecto.Changeset.t()
  def revoke_changeset(snapshot, revoked_at), do: change(snapshot, revoked_at: revoked_at)
end
