defmodule ProductCompare.Discussions.Submissions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Submissions.Creates
  alias ProductCompare.Discussions.Submissions.OwnerActions
  alias ProductCompare.Discussions.Submissions.WriteLimits
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec submit_review(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs, idempotency_key),
    do: Creates.submit_review(user_id, product_id, attrs, idempotency_key)

  @spec ask_question(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs, idempotency_key),
    do: Creates.ask_question(user_id, product_id, attrs, idempotency_key)

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body, idempotency_key),
    do: Creates.answer_question(user_id, question_entropy_id, body, idempotency_key)

  @spec update_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), map()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error,
             :forbidden | :not_found | :invalid_lifecycle | :rate_limited | Ecto.Changeset.t()}
  def update_owned(user_id, type, entropy_id, attrs) do
    OwnerActions.update(user_id, type, entropy_id, attrs)
  end

  @spec remove_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove_owned(user_id, type, entropy_id) do
    OwnerActions.remove(user_id, type, entropy_id)
  end

  @spec report(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | :rate_limited | Ecto.Changeset.t()}
  def report(reporter_id, type, entropy_id, reason) do
    with record when not is_nil(record) <- moderation_record(type, entropy_id) do
      target =
        case type do
          :review -> %{review_id: record.id}
          :question -> %{thread_id: record.id}
          :answer -> %{post_id: record.id}
        end

      transaction_result(fn ->
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

  defp transaction_result(callback), do: Repo.transaction(callback)

  defp moderation_record(:review, entropy_id), do: record_by_entropy(ProductReview, entropy_id)
  defp moderation_record(:question, entropy_id), do: record_by_entropy(ProductThread, entropy_id)
  defp moderation_record(:answer, entropy_id), do: record_by_entropy(ThreadPost, entropy_id)

  defp record_by_entropy(schema, entropy_id) do
    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id) do
      Repo.get_by(schema, entropy_id: uuid)
    else
      :error -> nil
    end
  end
end
