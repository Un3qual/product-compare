defmodule ProductCompare.Accounts.Reputation do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.UserReputation

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
end
