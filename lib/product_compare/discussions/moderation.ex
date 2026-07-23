defmodule ProductCompare.Discussions.Moderation do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec accept_answer(pos_integer(), Ecto.UUID.t(), Ecto.UUID.t()) ::
          {:ok, ProductThread.t()}
          | {:error, :not_found | :forbidden | :answer_not_published}
  def accept_answer(user_id, question_entropy_id, answer_entropy_id) do
    Repo.transaction(fn ->
      with %ProductThread{} = question <-
             locked_record_by_entropy(ProductThread, question_entropy_id),
           %ThreadPost{} = answer <- locked_record_by_entropy(ThreadPost, answer_entropy_id),
           true <- answer.thread_id == question.id || {:error, :not_found},
           true <- question.created_by == user_id || {:error, :forbidden},
           true <- answer.moderation_status == :published || {:error, :answer_not_published} do
        question
        |> Ecto.Changeset.change(accepted_post_id: answer.id)
        |> update_or_rollback()
      else
        nil -> Repo.rollback(:not_found)
        {:error, reason} -> Repo.rollback(reason)
        false -> Repo.rollback(:not_found)
      end
    end)
    |> case do
      {:ok, accepted_question} -> {:ok, Repo.preload(accepted_question, :accepted_post)}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec moderate(
          pos_integer(),
          :review | :question | :answer,
          Ecto.UUID.t(),
          atom(),
          String.t() | nil
        ) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def moderate(operator_id, type, entropy_id, status, note) do
    with %User{is_operator: true} <- Repo.get(User, operator_id) do
      moderate_record(
        type,
        entropy_id,
        status,
        operator_id,
        note,
        DateTime.utc_now() |> DateTime.truncate(:microsecond)
      )
    else
      %User{} -> {:error, :forbidden}
      nil -> {:error, :not_found}
    end
  end

  @doc false
  def locked_record_by_entropy(schema, entropy_id) do
    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id) do
      Repo.one(from record in schema, where: record.entropy_id == ^uuid, lock: "FOR UPDATE")
    else
      :error -> nil
    end
  end

  defp moderate_record(:answer, entropy_id, status, moderator_id, note, now) do
    transaction_result(fn ->
      with_locked_answer(entropy_id, fn answer, question ->
        ensure_moderatable!(answer)

        updated_answer =
          answer
          |> moderation_changeset(status, moderator_id, note, now)
          |> update_or_rollback()

        if status != :published and question.accepted_post_id == answer.id do
          question
          |> Ecto.Changeset.change(accepted_post_id: nil)
          |> update_or_rollback()
        end

        updated_answer
      end)
    end)
  end

  defp moderate_record(type, entropy_id, status, moderator_id, note, now)
       when type in [:review, :question] do
    transaction_result(fn ->
      record = locked_content_or_rollback!(type, entropy_id)
      ensure_moderatable!(record)

      record
      |> moderation_changeset(status, moderator_id, note, now)
      |> update_or_rollback()
    end)
  end

  @doc false
  def with_locked_answer(entropy_id, callback) do
    case record_by_entropy(ThreadPost, entropy_id) do
      nil ->
        Repo.rollback(:not_found)

      %ThreadPost{} = unlocked_answer ->
        question =
          Repo.one(
            from question in ProductThread,
              where: question.id == ^unlocked_answer.thread_id,
              lock: "FOR UPDATE"
          )

        if is_nil(question), do: Repo.rollback(:not_found)

        answer =
          Repo.one(
            from answer in ThreadPost,
              where: answer.id == ^unlocked_answer.id,
              where: answer.thread_id == ^question.id,
              lock: "FOR UPDATE"
          )

        if is_nil(answer), do: Repo.rollback(:not_found)
        callback.(answer, question)
    end
  end

  defp locked_content_or_rollback!(type, entropy_id) do
    schema = content_schema(type)

    case locked_record_by_entropy(schema, entropy_id) do
      nil -> Repo.rollback(:not_found)
      record -> record
    end
  end

  defp content_schema(:review), do: ProductReview
  defp content_schema(:question), do: ProductThread

  defp ensure_moderatable!(%{moderation_status: :removed}),
    do: Repo.rollback(:invalid_lifecycle)

  defp ensure_moderatable!(_record), do: :ok

  defp update_or_rollback(changeset) do
    case Repo.update(changeset) do
      {:ok, record} -> record
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end

  defp moderation_changeset(%ProductReview{} = review, status, moderator_id, note, now),
    do: ProductReview.moderation_changeset(review, status, moderator_id, note, now)

  defp moderation_changeset(%ProductThread{} = thread, status, moderator_id, note, now),
    do: ProductThread.moderation_changeset(thread, status, moderator_id, note, now)

  defp moderation_changeset(%ThreadPost{} = post, status, moderator_id, note, now),
    do: ThreadPost.moderation_changeset(post, status, moderator_id, note, now)

  defp record_by_entropy(schema, entropy_id) do
    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id) do
      Repo.get_by(schema, entropy_id: uuid)
    else
      :error -> nil
    end
  end

  defp transaction_result(callback), do: Repo.transaction(callback)
end
