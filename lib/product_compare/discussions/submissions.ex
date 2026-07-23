defmodule ProductCompare.Discussions.Submissions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Submissions.Creates
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
    transaction_result(fn -> update_owned_transaction(user_id, type, entropy_id, attrs) end)
  end

  @spec remove_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove_owned(user_id, type, entropy_id) do
    transaction_result(fn -> remove_owned_transaction(user_id, type, entropy_id) end)
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

  defp update_owned_transaction(user_id, :answer, entropy_id, attrs) do
    Moderation.with_locked_answer(entropy_id, fn answer, question ->
      ensure_owner_and_editable!(answer, user_id)

      changeset = owned_update_changeset(:answer, answer, attrs)
      ensure_valid!(changeset)
      WriteLimits.increment!(user_id, :answer)
      updated_answer = update_or_rollback(changeset)
      clear_accepted_answer!(question, answer)
      updated_answer
    end)
  end

  defp update_owned_transaction(user_id, :review, entropy_id, attrs) do
    review = locked_content_or_rollback!(:review, entropy_id)
    ensure_owner_and_editable!(review, user_id)

    changeset = owned_update_changeset(:review, review, attrs)
    ensure_valid!(changeset)
    WriteLimits.increment!(user_id, :review)
    update_or_rollback(changeset)
  end

  defp update_owned_transaction(user_id, :question, entropy_id, attrs) do
    question = locked_content_or_rollback!(:question, entropy_id)
    ensure_owner_and_editable!(question, user_id)

    changeset = owned_update_changeset(:question, question, attrs)
    ensure_valid!(changeset)
    WriteLimits.increment!(user_id, :question)

    changeset
    |> Ecto.Changeset.change(accepted_post_id: nil)
    |> update_or_rollback()
  end

  defp remove_owned_transaction(user_id, :answer, entropy_id) do
    Moderation.with_locked_answer(entropy_id, fn answer, question ->
      ensure_owner_and_editable!(answer, user_id)

      removed_answer =
        answer
        |> Ecto.Changeset.change(moderation_status: :removed)
        |> update_or_rollback()

      clear_accepted_answer!(question, answer)
      removed_answer
    end)
  end

  defp remove_owned_transaction(user_id, type, entropy_id) when type in [:review, :question] do
    record = locked_content_or_rollback!(type, entropy_id)
    ensure_owner_and_editable!(record, user_id)

    record
    |> Ecto.Changeset.change(moderation_status: :removed)
    |> update_or_rollback()
  end

  defp locked_content_or_rollback!(type, entropy_id) do
    schema = content_schema(type)

    case Moderation.locked_record_by_entropy(schema, entropy_id) do
      nil -> Repo.rollback(:not_found)
      record -> record
    end
  end

  defp content_schema(:review), do: ProductReview
  defp content_schema(:question), do: ProductThread

  defp ensure_owner_and_editable!(record, user_id) do
    cond do
      content_owner_id(record) != user_id -> Repo.rollback(:forbidden)
      record.moderation_status == :removed -> Repo.rollback(:invalid_lifecycle)
      true -> :ok
    end
  end

  defp content_owner_id(%ProductReview{user_id: user_id}), do: user_id
  defp content_owner_id(%ProductThread{created_by: user_id}), do: user_id
  defp content_owner_id(%ThreadPost{user_id: user_id}), do: user_id

  defp owned_update_changeset(:review, review, attrs) do
    review
    |> ProductReview.changeset_with_verified_purchase(
      owner_attrs(attrs,
        rating: :rating,
        title: :title,
        body: :body_md
      ),
      false
    )
    |> reset_moderation_changes()
  end

  defp owned_update_changeset(:question, question, attrs) do
    question
    |> ProductThread.changeset(owner_attrs(attrs, title: :title, body: :body_md))
    |> reset_moderation_changes()
  end

  defp owned_update_changeset(:answer, answer, attrs) do
    answer
    |> ThreadPost.changeset(owner_attrs(attrs, body: :body_md))
    |> reset_moderation_changes()
  end

  defp owner_attrs(attrs, mappings) do
    Enum.reduce(mappings, %{}, fn {source, target}, normalized ->
      cond do
        Map.has_key?(attrs, source) ->
          Map.put(normalized, target, Map.get(attrs, source))

        Map.has_key?(attrs, Atom.to_string(source)) ->
          Map.put(normalized, target, Map.get(attrs, Atom.to_string(source)))

        true ->
          normalized
      end
    end)
  end

  defp reset_moderation_changes(changeset) do
    Ecto.Changeset.change(changeset,
      moderation_status: :pending,
      moderation_note: nil,
      moderated_by: nil,
      moderated_at: nil
    )
  end

  defp ensure_valid!(%Ecto.Changeset{valid?: true}), do: :ok
  defp ensure_valid!(%Ecto.Changeset{} = changeset), do: Repo.rollback(changeset)

  defp clear_accepted_answer!(%ProductThread{accepted_post_id: answer_id} = question, %{
         id: answer_id
       })
       when not is_nil(answer_id) do
    question
    |> Ecto.Changeset.change(accepted_post_id: nil)
    |> update_or_rollback()
  end

  defp clear_accepted_answer!(_question, _answer), do: :ok

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

  defp update_or_rollback(changeset) do
    case Repo.update(changeset) do
      {:ok, record} -> record
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end
end
