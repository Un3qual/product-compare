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

  @spec changeset_with_user(t(), map(), integer()) :: Ecto.Changeset.t()
  def changeset_with_user(event, attrs, user_id), do: do_changeset(event, attrs, user_id)

  @spec do_changeset(t(), map(), integer() | nil) :: Ecto.Changeset.t()
  defp do_changeset(event, attrs, user_id) do
    event
    |> cast(attrs, [:delta, :reason, :ref_table, :ref_id])
    |> maybe_put_user_id(user_id)
    |> validate_required([:user_id, :delta, :reason])
    |> validate_ref_pair()
    |> foreign_key_constraint(:user_id)
  end

  defp maybe_put_user_id(changeset, nil), do: changeset
  defp maybe_put_user_id(changeset, user_id), do: put_change(changeset, :user_id, user_id)

  defp validate_ref_pair(changeset) do
    ref_table = get_field(changeset, :ref_table)
    ref_id = get_field(changeset, :ref_id)

    case {ref_table, ref_id} do
      {nil, nil} ->
        changeset

      {table, id} when is_binary(table) and is_integer(id) ->
        changeset

      {nil, _id} ->
        add_error(changeset, :ref_table, "must be set when ref_id is present")

      {_table, nil} ->
        add_error(changeset, :ref_id, "must be set when ref_table is present")

      {table, id} when not is_nil(table) and not is_nil(id) ->
        changeset =
          if not is_binary(table),
            do: add_error(changeset, :ref_table, "must be a string"),
            else: changeset

        if not is_integer(id),
          do: add_error(changeset, :ref_id, "must be an integer"),
          else: changeset
    end
  end
end
