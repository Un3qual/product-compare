defmodule ProductCompare.Accounts do
  @moduledoc """
  Accounts context for users and reputation events.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ReputationEvent
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

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
    case Repo.get_by(UserReputation, user_id: user_id) do
      nil ->
        %UserReputation{}
        |> UserReputation.changeset(%{user_id: user_id, points: points})
        |> Repo.insert()

      reputation ->
        reputation
        |> UserReputation.changeset(%{points: points})
        |> Repo.update()
    end
  end

  @spec add_reputation_event(map()) :: {:ok, ReputationEvent.t()} | {:error, Ecto.Changeset.t()}
  def add_reputation_event(attrs) do
    %ReputationEvent{}
    |> ReputationEvent.changeset(attrs)
    |> Repo.insert()
  end

  @spec list_reputation_events(pos_integer()) :: [ReputationEvent.t()]
  def list_reputation_events(user_id) do
    Repo.all(
      from e in ReputationEvent,
        where: e.user_id == ^user_id,
        order_by: [desc: e.inserted_at]
    )
  end
end
