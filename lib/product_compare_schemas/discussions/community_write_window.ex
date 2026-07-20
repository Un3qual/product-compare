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
    |> unique_constraint([:user_id, :action_kind, :window_started_at],
      name: :community_write_windows_user_action_window_uq,
      error_key: :window_started_at
    )
    |> check_constraint(:action_kind, name: :community_write_windows_action_kind_check)
    |> check_constraint(:count, name: :community_write_windows_count_check)
    |> check_constraint(:window_started_at, name: :community_write_windows_hour_check)
    |> foreign_key_constraint(:user_id)
  end
end
