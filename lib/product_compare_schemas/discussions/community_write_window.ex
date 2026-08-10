defmodule ProductCompareSchemas.Discussions.CommunityWriteWindow do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "community_write_windows" do
    field :action_kind, Ecto.Enum, values: [:review, :question, :answer, :report]
    field :window_started_at, :utc_datetime_usec
    field :count, :integer, default: 0

    belongs_to :user, ProductCompareSchemas.Accounts.User

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(window, attrs) do
    window
    |> cast(attrs, [:user_id, :action_kind, :window_started_at, :count])
    |> validate_required([:user_id, :action_kind, :window_started_at, :count])
    |> validate_number(:count, greater_than_or_equal_to: 0)
    |> validate_hour_boundary()
    |> unique_constraint([:user_id, :action_kind, :window_started_at],
      name: :community_write_windows_user_action_window_uq,
      error_key: :window_started_at
    )
    |> check_constraint(:count, name: :community_write_windows_count_check)
    |> check_constraint(:window_started_at, name: :community_write_windows_hour_check)
    |> foreign_key_constraint(:user_id)
  end

  defp validate_hour_boundary(changeset) do
    case get_field(changeset, :window_started_at) do
      %DateTime{} = datetime ->
        if rem(DateTime.to_unix(datetime, :microsecond), 3_600_000_000) == 0 do
          changeset
        else
          add_error(changeset, :window_started_at, "is invalid")
        end

      _missing_or_invalid ->
        changeset
    end
  end
end
