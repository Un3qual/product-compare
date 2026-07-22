defmodule ProductCompare.Discussions.Submissions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.CommunityWriteWindow
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @default_write_limits [review: 5, question: 10, answer: 30, report: 30]

  @spec submit_review(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs, idempotency_key) do
    changeset =
      %ProductReview{}
      |> ProductReview.changeset_with_verified_purchase(
        %{
          user_id: user_id,
          product_id: product_id,
          merchant_product_id: get_attr_value(attrs, :merchant_product_id),
          rating: get_attr_value(attrs, :rating),
          title: get_attr_value(attrs, :title),
          body_md: get_attr_value(attrs, :body)
        },
        false
      )

    with {:ok, digest} <-
           submission_digest(changeset, :review, [
             :product_id,
             :merchant_product_id,
             :rating,
             :title,
             :body_md
           ]) do
      idempotent_insert(user_id, :review, idempotency_key, digest, changeset)
    end
  end

  @spec ask_question(pos_integer(), pos_integer(), map(), String.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs, idempotency_key) do
    changeset =
      ProductThread.changeset(%ProductThread{}, %{
        product_id: product_id,
        created_by: user_id,
        title: get_attr_value(attrs, :title),
        body_md: get_attr_value(attrs, :body),
        kind: :question
      })

    with {:ok, digest} <-
           submission_digest(changeset, :question, [:product_id, :title, :body_md]) do
      idempotent_insert(user_id, :question, idempotency_key, digest, changeset)
    end
  end

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body, idempotency_key) do
    with %ProductThread{} = question <- question_by_entropy(question_entropy_id),
         changeset <-
           ThreadPost.changeset(%ThreadPost{}, %{
             thread_id: question.id,
             user_id: user_id,
             body_md: body
           }),
         {:ok, digest} <-
           submission_digest(changeset, :answer, [:thread_id, :body_md], question.entropy_id) do
      idempotent_insert(user_id, :answer, idempotency_key, digest, changeset, fn ->
        case locked_record_by_entropy(ProductThread, question.entropy_id) do
          %ProductThread{kind: :question, moderation_status: :published} -> :ok
          _not_public -> Repo.rollback(:not_found)
        end
      end)
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

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

        increment_write_window!(reporter_id, :report)

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

  defp submission_digest(changeset, mutation_kind, fields, target \\ nil) do
    if changeset.valid? do
      values = Enum.map(fields, &{&1, Ecto.Changeset.get_field(changeset, &1)})
      payload = {mutation_kind, target, values}
      {:ok, :crypto.hash(:sha256, :erlang.term_to_binary(payload, [:deterministic]))}
    else
      {:error, changeset}
    end
  end

  defp idempotent_insert(
         user_id,
         mutation_kind,
         idempotency_key,
         digest,
         changeset,
         before_insert \\ fn -> :ok end
       ) do
    with :ok <- validate_idempotency_key(user_id, mutation_kind, idempotency_key, digest) do
      transaction_result(fn ->
        lock_idempotency_key!(user_id, mutation_kind, idempotency_key)

        case locked_write_receipt(user_id, mutation_kind, idempotency_key) do
          %CommunityWriteReceipt{payload_digest: ^digest} = receipt ->
            case moderation_record(receipt.content_type, receipt.content_entropy_id) do
              nil -> Repo.rollback(:not_found)
              content -> content
            end

          %CommunityWriteReceipt{} ->
            Repo.rollback(:idempotency_conflict)

          nil ->
            :ok = before_insert.()
            increment_write_window!(user_id, mutation_kind)
            inserted_content = insert_or_rollback(changeset)
            content = Repo.get!(inserted_content.__struct__, inserted_content.id)

            %CommunityWriteReceipt{}
            |> CommunityWriteReceipt.changeset(%{
              user_id: user_id,
              mutation_kind: mutation_kind,
              idempotency_key: idempotency_key,
              payload_digest: digest,
              content_type: mutation_kind,
              content_entropy_id: content.entropy_id
            })
            |> insert_or_rollback()

            content
        end
      end)
    end
  end

  defp validate_idempotency_key(user_id, mutation_kind, idempotency_key, digest) do
    changeset =
      CommunityWriteReceipt.changeset(%CommunityWriteReceipt{}, %{
        user_id: user_id,
        mutation_kind: mutation_kind,
        idempotency_key: idempotency_key,
        payload_digest: digest,
        content_type: mutation_kind,
        content_entropy_id: Ecto.UUID.generate()
      })

    if changeset.valid?, do: :ok, else: {:error, changeset}
  end

  defp lock_idempotency_key!(user_id, mutation_kind, idempotency_key) do
    Repo.query!("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "#{user_id}:#{mutation_kind}:#{idempotency_key}"
    ])
  end

  defp locked_write_receipt(user_id, mutation_kind, idempotency_key) do
    Repo.one(
      from receipt in CommunityWriteReceipt,
        where: receipt.user_id == ^user_id,
        where: receipt.mutation_kind == ^mutation_kind,
        where: receipt.idempotency_key == ^idempotency_key,
        lock: "FOR UPDATE"
    )
  end

  defp update_owned_transaction(user_id, :answer, entropy_id, attrs) do
    with_locked_answer(entropy_id, fn answer, question ->
      ensure_owner_and_editable!(answer, user_id)

      changeset = owned_update_changeset(:answer, answer, attrs)
      ensure_valid!(changeset)
      increment_write_window!(user_id, :answer)
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
    increment_write_window!(user_id, :review)
    update_or_rollback(changeset)
  end

  defp update_owned_transaction(user_id, :question, entropy_id, attrs) do
    question = locked_content_or_rollback!(:question, entropy_id)
    ensure_owner_and_editable!(question, user_id)

    changeset = owned_update_changeset(:question, question, attrs)
    ensure_valid!(changeset)
    increment_write_window!(user_id, :question)

    changeset
    |> Ecto.Changeset.change(accepted_post_id: nil)
    |> update_or_rollback()
  end

  defp remove_owned_transaction(user_id, :answer, entropy_id) do
    with_locked_answer(entropy_id, fn answer, question ->
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

  defp with_locked_answer(entropy_id, callback) do
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

  defp increment_write_window!(user_id, action_kind) do
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

    if window.count >= community_write_limit(action_kind), do: Repo.rollback(:rate_limited)

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

  defp community_write_limit(action_kind) do
    configured_limits =
      :product_compare
      |> Application.get_env(ProductCompare.Discussions, [])
      |> Keyword.get(:community_write_limits, @default_write_limits)

    case Keyword.get(configured_limits, action_kind) do
      limit when is_integer(limit) and limit >= 0 -> limit
      _invalid -> Keyword.fetch!(@default_write_limits, action_kind)
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

  defp insert_or_rollback(changeset) do
    case Repo.insert(changeset) do
      {:ok, record} -> record
      {:error, %Ecto.Changeset{} = changeset} -> Repo.rollback(changeset)
    end
  end

  defp transaction_result(callback), do: Repo.transaction(callback)

  defp question_by_entropy(entropy_id), do: record_by_entropy(ProductThread, entropy_id)

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

  defp locked_record_by_entropy(schema, entropy_id) do
    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id) do
      Repo.one(from record in schema, where: record.entropy_id == ^uuid, lock: "FOR UPDATE")
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

  defp get_attr_value(attrs, key) when is_map(attrs),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
end
