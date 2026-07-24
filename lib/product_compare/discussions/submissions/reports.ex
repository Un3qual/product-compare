defmodule ProductCompare.Discussions.Submissions.Reports do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Submissions.WriteLimits
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityReport

  @spec create(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | :rate_limited | Ecto.Changeset.t()}
  def create(reporter_id, type, entropy_id, reason) do
    with record when not is_nil(record) <-
           Moderation.record_by_type_and_entropy(type, entropy_id) do
      target =
        case type do
          :review -> %{review_id: record.id}
          :question -> %{thread_id: record.id}
          :answer -> %{post_id: record.id}
        end

      Repo.transaction(fn ->
        if report_exists?(reporter_id, type, record.id), do: Repo.rollback(:already_reported)

        WriteLimits.increment!(reporter_id, :report)

        changeset =
          CommunityReport.changeset(
            %CommunityReport{},
            Map.merge(target, %{reporter_id: reporter_id, reason: reason})
          )

        case Repo.insert(changeset) do
          {:ok, report} ->
            report

          {:error, %Ecto.Changeset{} = changeset} ->
            if unique_constraint_error?(changeset),
              do: Repo.rollback(:already_reported),
              else: Repo.rollback(changeset)
        end
      end)
    else
      nil -> {:error, :not_found}
    end
  end

  defp report_exists?(reporter_id, :review, content_id),
    do:
      Repo.exists?(
        from report in CommunityReport,
          where: report.reporter_id == ^reporter_id and report.review_id == ^content_id
      )

  defp report_exists?(reporter_id, :question, content_id),
    do:
      Repo.exists?(
        from report in CommunityReport,
          where: report.reporter_id == ^reporter_id and report.thread_id == ^content_id
      )

  defp report_exists?(reporter_id, :answer, content_id),
    do:
      Repo.exists?(
        from report in CommunityReport,
          where: report.reporter_id == ^reporter_id and report.post_id == ^content_id
      )

  defp unique_constraint_error?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn {_field, {_message, opts}} -> opts[:constraint] == :unique end)
  end
end
