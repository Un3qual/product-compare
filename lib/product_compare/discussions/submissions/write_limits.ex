defmodule ProductCompare.Discussions.Submissions.WriteLimits do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityWriteWindow

  @default_limits [review: 5, question: 10, answer: 30, report: 30]

  @spec increment!(pos_integer(), :review | :question | :answer | :report) :: :ok
  def increment!(user_id, action_kind) do
    window_started_at = utc_hour(DateTime.utc_now())
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    %CommunityWriteWindow{}
    |> CommunityWriteWindow.changeset(%{
      user_id: user_id,
      action_kind: action_kind,
      window_started_at: window_started_at,
      count: 0
    })
    |> Repo.insert!(
      on_conflict: :nothing,
      conflict_target: [:user_id, :action_kind, :window_started_at]
    )

    window =
      Repo.one!(
        from window in CommunityWriteWindow,
          where: window.user_id == ^user_id,
          where: window.action_kind == ^action_kind,
          where: window.window_started_at == ^window_started_at,
          lock: "FOR UPDATE"
      )

    if window.count >= write_limit(action_kind), do: Repo.rollback(:rate_limited)

    window
    |> Ecto.Changeset.change(count: window.count + 1, updated_at: now)
    |> Repo.update!()

    :ok
  end

  defp utc_hour(datetime) do
    datetime
    |> DateTime.to_unix(:second)
    |> div(3600)
    |> Kernel.*(3600)
    |> DateTime.from_unix!(:second)
  end

  defp write_limit(action_kind) do
    configured_limits =
      :product_compare
      |> Application.get_env(ProductCompare.Discussions, [])
      |> Keyword.get(:community_write_limits, @default_limits)

    case Keyword.get(configured_limits, action_kind) do
      limit when is_integer(limit) and limit >= 0 -> limit
      _invalid -> Keyword.fetch!(@default_limits, action_kind)
    end
  end
end
