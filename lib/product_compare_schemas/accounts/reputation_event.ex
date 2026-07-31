defmodule ProductCompareSchemas.Accounts.ReputationEvent do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "reputation_events" do
    field :entropy_id, Ecto.UUID
    field :delta, :integer

    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :reputation_event_type, ProductCompareSchemas.Accounts.ReputationEventType

    timestamps(updated_at: false)
  end

  @spec changeset_with_user(t(), map(), integer()) :: Ecto.Changeset.t()
  def changeset_with_user(event, attrs, user_id), do: do_changeset(event, attrs, user_id)

  @spec do_changeset(t(), map(), integer() | nil) :: Ecto.Changeset.t()
  defp do_changeset(event, attrs, user_id) do
    event
    |> cast(attrs, [:delta, :reputation_event_type_id])
    |> maybe_put_user_id(user_id)
    |> validate_required([:user_id, :delta, :reputation_event_type_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:reputation_event_type_id)
  end

  defp maybe_put_user_id(changeset, nil), do: changeset
  defp maybe_put_user_id(changeset, user_id), do: put_change(changeset, :user_id, user_id)
end
