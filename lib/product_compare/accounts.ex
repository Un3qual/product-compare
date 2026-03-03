defmodule ProductCompare.Accounts do
  @moduledoc """
  Accounts context for users and reputation events.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ReputationEvent
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

  @default_reputation_events_limit 50
  @max_reputation_events_limit 200

  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @spec get_user!(pos_integer()) :: User.t()
  def get_user!(id), do: Repo.get!(User, id)

  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email), do: Repo.get_by(User, email: String.downcase(email))

  @spec upsert_user_reputation(pos_integer(), integer()) ::
          {:ok, UserReputation.t()} | {:error, Ecto.Changeset.t()}
  def upsert_user_reputation(user_id, points) do
    now = DateTime.utc_now()

    %UserReputation{}
    |> UserReputation.changeset(%{user_id: user_id, points: points})
    |> Repo.insert(
      on_conflict: [set: [points: points, updated_at: now]],
      conflict_target: [:user_id],
      returning: true
    )
  end

  @spec add_reputation_event(map()) :: {:ok, ReputationEvent.t()} | {:error, Ecto.Changeset.t()}
  def add_reputation_event(attrs) do
    %ReputationEvent{}
    |> ReputationEvent.changeset(attrs)
    |> Repo.insert()
  end

  @spec list_reputation_events(pos_integer(), keyword() | map()) :: [ReputationEvent.t()]
  def list_reputation_events(user_id, opts \\ []) do
    limit =
      opts
      |> get_pagination_value(:limit, @default_reputation_events_limit)
      |> clamp_limit(@default_reputation_events_limit, @max_reputation_events_limit)

    offset =
      opts
      |> get_pagination_value(:offset, 0)
      |> clamp_non_negative(0)

    Repo.all(
      from e in ReputationEvent,
        where: e.user_id == ^user_id,
        order_by: [desc: e.inserted_at, desc: e.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  defp get_pagination_value(opts, key, default) when is_list(opts),
    do: Keyword.get(opts, key, default)

  defp get_pagination_value(opts, key, default) when is_map(opts),
    do: Map.get(opts, key, Map.get(opts, Atom.to_string(key), default))

  defp get_pagination_value(_opts, _key, default), do: default

  defp clamp_limit(value, _default, max) when is_integer(value) and value > 0, do: min(value, max)
  defp clamp_limit(_value, default, _max), do: default

  defp clamp_non_negative(value, _default) when is_integer(value) and value >= 0, do: value
  defp clamp_non_negative(_value, default), do: default
end
