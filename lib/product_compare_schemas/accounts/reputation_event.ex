defmodule ProductCompareSchemas.Accounts.ReputationEvent do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "reputation_events" do
    field :entropy_id, Ecto.UUID
    field :delta, :integer
    field :reason, :string
    field :ref_table, :string
    field :ref_id, :integer

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(event, attrs), do: do_changeset(event, attrs, nil)

  @spec changeset_with_user(t(), map(), integer()) :: Ecto.Changeset.t()
  def changeset_with_user(event, attrs, user_id), do: do_changeset(event, attrs, user_id)

  @spec do_changeset(t(), map(), integer() | nil) :: Ecto.Changeset.t()
  defp do_changeset(event, attrs, user_id) do
    event
    |> cast(attrs, [:delta, :reason, :ref_table, :ref_id])
    |> maybe_put_user_id(user_id)
    |> validate_required([:user_id, :delta, :reason])
    |> foreign_key_constraint(:user_id)
  end

  defp maybe_put_user_id(changeset, nil), do: changeset
  defp maybe_put_user_id(changeset, user_id), do: put_change(changeset, :user_id, user_id)
end
