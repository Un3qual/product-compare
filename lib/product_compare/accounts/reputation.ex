defmodule ProductCompare.Accounts.Reputation do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ReputationEvent
  alias ProductCompareSchemas.Accounts.UserReputation

  @default_reputation_events_limit 50
  @max_reputation_events_limit 200

  @spec upsert_user_reputation(pos_integer(), integer()) ::
          {:ok, UserReputation.t()} | {:error, Ecto.Changeset.t()}
  def upsert_user_reputation(user_id, points) do
    %UserReputation{}
    |> UserReputation.changeset(%{user_id: user_id, points: points})
    |> Repo.insert(
      on_conflict: [set: [points: points]],
      conflict_target: [:user_id],
      returning: true
    )
  end

  @spec add_reputation_event(pos_integer(), map()) ::
          {:ok, ReputationEvent.t()} | {:error, Ecto.Changeset.t()}
  def add_reputation_event(user_id, attrs) do
    %ReputationEvent{}
    |> ReputationEvent.changeset_with_user(attrs, user_id)
    |> Repo.insert()
  end

  @spec list_reputation_events(pos_integer(), keyword() | map()) :: [ReputationEvent.t()]
  def list_reputation_events(user_id, opts \\ []) do
    limit =
      opts
      |> Input.pagination_value(:limit, @default_reputation_events_limit)
      |> Input.clamp_limit(@default_reputation_events_limit, @max_reputation_events_limit)

    offset =
      opts
      |> Input.pagination_value(:offset, 0)
      |> Input.clamp_non_negative(0)

    Repo.all(
      from event in ReputationEvent,
        where: event.user_id == ^user_id,
        order_by: [desc: event.inserted_at, desc: event.id],
        limit: ^limit,
        offset: ^offset
    )
  end
end
