defmodule ProductCompare.Discussions do
  @moduledoc """
  Discussions context for threads, posts, and product reviews.
  """

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.CommunityWriteWindow
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @default_page_limit 50
  @max_page_limit 200
  @owner_submission_limit 50
  @non_public_owner_statuses [:pending, :hidden, :rejected]
  @default_write_limits [review: 5, question: 10, answer: 30, report: 30]

  @spec list_threads_for_product(pos_integer(), keyword() | map()) :: [ProductThread.t()]
  def list_threads_for_product(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from t in ProductThread,
        where: t.product_id == ^product_id,
        order_by: [desc: t.inserted_at, desc: t.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec list_posts_for_thread(pos_integer(), keyword() | map()) :: [ThreadPost.t()]
  def list_posts_for_thread(thread_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from p in ThreadPost,
        where: p.thread_id == ^thread_id,
        order_by: [asc: p.inserted_at, asc: p.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec create_thread(map()) :: {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def create_thread(attrs) do
    %ProductThread{}
    |> ProductThread.changeset(attrs)
    |> Repo.insert()
  end

  @spec update_thread(ProductThread.t(), map()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def update_thread(%ProductThread{} = thread, attrs) do
    thread
    |> ProductThread.changeset(attrs)
    |> Repo.update()
  end

  @spec delete_thread(ProductThread.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def delete_thread(%ProductThread{} = thread), do: Repo.delete(thread)

  @spec create_post(map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def create_post(attrs) do
    %ThreadPost{}
    |> ThreadPost.changeset(attrs)
    |> validate_post_parent()
    |> Repo.insert()
  end

  @spec update_post(ThreadPost.t(), map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def update_post(%ThreadPost{} = post, attrs) do
    if parent_update?(attrs) do
      update_post_parent(post, attrs)
    else
      post
      |> ThreadPost.changeset(attrs)
      |> Repo.update()
    end
  end

  @spec delete_post(ThreadPost.t()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def delete_post(%ThreadPost{} = post), do: Repo.delete(post)

  @spec list_reviews_for_product(pos_integer(), keyword() | map()) :: [ProductReview.t()]
  def list_reviews_for_product(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    Repo.all(
      from r in ProductReview,
        where: r.product_id == ^product_id,
        order_by: [desc: r.inserted_at, desc: r.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  @spec create_review(map()) :: {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def create_review(attrs) do
    sanitized_attrs = drop_client_verified_purchase(attrs)

    %ProductReview{}
    |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, false)
    |> Repo.insert()
  end

  @spec update_review(ProductReview.t(), map()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def update_review(%ProductReview{} = review, attrs) do
    sanitized_attrs = drop_client_verified_purchase(attrs)

    Repo.transaction(fn ->
      persisted_review =
        Repo.one!(
          from persisted_review in ProductReview,
            where: persisted_review.id == ^review.id,
            lock: "FOR UPDATE"
        )

      persisted_review
      |> ProductReview.changeset_with_verified_purchase(sanitized_attrs, false)
      |> Repo.update()
      |> case do
        {:ok, updated_review} -> updated_review
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @spec delete_review(ProductReview.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def delete_review(%ProductReview{} = review), do: Repo.delete(review)

  @spec submit_review(pos_integer(), pos_integer(), map()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs) do
    submit_review(user_id, product_id, attrs, Ecto.UUID.generate())
  end

  @spec submit_review(pos_integer(), pos_integer(), map(), String.t() | nil) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t() | atom()}
  def submit_review(user_id, product_id, attrs, nil),
    do: submit_review(user_id, product_id, attrs)

  def submit_review(user_id, product_id, attrs, idempotency_key)
      when is_integer(user_id) and user_id > 0 and is_integer(product_id) and product_id > 0 and
             is_map(attrs) and is_binary(idempotency_key) do
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

  def submit_review(_user_id, _product_id, _attrs, _idempotency_key),
    do: {:error, :invalid_argument}

  @spec list_public_reviews(pos_integer(), keyword()) :: [ProductReview.t()]
  def list_public_reviews(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    product_id
    |> public_reviews_query()
    |> limit(^limit)
    |> offset(^offset)
    |> Repo.all()
  end

  @spec public_reviews_query(pos_integer()) :: Ecto.Query.t()
  def public_reviews_query(product_id) do
    from review in ProductReview,
      where: review.product_id == ^product_id and review.moderation_status == :published,
      order_by: [desc: review.inserted_at, desc: review.id]
  end

  @spec review_summary(pos_integer()) :: %{
          count: non_neg_integer(),
          average_rating: Decimal.t() | nil
        }
  def review_summary(product_id) do
    {count, average} =
      Repo.one(
        from review in ProductReview,
          where: review.product_id == ^product_id and review.moderation_status == :published,
          select: {count(review.id), avg(review.rating)}
      )

    %{count: count, average_rating: average && Decimal.round(average, 2)}
  end

  @spec ask_question(pos_integer(), pos_integer(), map()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs) do
    ask_question(user_id, product_id, attrs, Ecto.UUID.generate())
  end

  @spec ask_question(pos_integer(), pos_integer(), map(), String.t() | nil) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t() | atom()}
  def ask_question(user_id, product_id, attrs, nil),
    do: ask_question(user_id, product_id, attrs)

  def ask_question(user_id, product_id, attrs, idempotency_key)
      when is_integer(user_id) and user_id > 0 and is_integer(product_id) and product_id > 0 and
             is_map(attrs) and is_binary(idempotency_key) do
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

  def ask_question(_user_id, _product_id, _attrs, _idempotency_key),
    do: {:error, :invalid_argument}

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body) do
    answer_question(user_id, question_entropy_id, body, Ecto.UUID.generate())
  end

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t(), String.t() | nil) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t() | atom()}
  def answer_question(user_id, question_entropy_id, body, nil),
    do: answer_question(user_id, question_entropy_id, body)

  def answer_question(user_id, question_entropy_id, body, idempotency_key)
      when is_integer(user_id) and user_id > 0 and is_binary(question_entropy_id) and
             is_binary(idempotency_key) do
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

  def answer_question(_user_id, _question_entropy_id, _body, _idempotency_key),
    do: {:error, :invalid_argument}

  @spec update_owned(
          pos_integer(),
          :review | :question | :answer,
          Ecto.UUID.t(),
          map()
        ) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error,
             :forbidden | :not_found | :invalid_lifecycle | :rate_limited | Ecto.Changeset.t()}
  def update_owned(user_id, type, entropy_id, attrs)
      when is_integer(user_id) and user_id > 0 and type in [:review, :question, :answer] and
             is_binary(entropy_id) and is_map(attrs) do
    transaction_result(fn -> update_owned_transaction(user_id, type, entropy_id, attrs) end)
  end

  def update_owned(_user_id, _type, _entropy_id, _attrs), do: {:error, :not_found}

  @spec remove_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove_owned(user_id, type, entropy_id)
      when is_integer(user_id) and user_id > 0 and type in [:review, :question, :answer] and
             is_binary(entropy_id) do
    transaction_result(fn -> remove_owned_transaction(user_id, type, entropy_id) end)
  end

  def remove_owned(_user_id, _type, _entropy_id), do: {:error, :not_found}

  @spec list_public_questions(pos_integer(), keyword()) :: [ProductThread.t()]
  def list_public_questions(product_id, opts \\ []) do
    {limit, offset} = normalize_pagination(opts)

    published_posts =
      from post in ThreadPost,
        where: post.moderation_status == :published,
        order_by: [asc: post.inserted_at, asc: post.id]

    Repo.all(
      from thread in ProductThread,
        where:
          thread.product_id == ^product_id and thread.kind == :question and
            thread.moderation_status == :published,
        order_by: [desc: thread.inserted_at, desc: thread.id],
        limit: ^limit,
        offset: ^offset,
        preload: [posts: ^published_posts]
    )
  end

  @spec viewer_community_submissions(pos_integer(), pos_integer()) :: %{
          reviews: [ProductReview.t()],
          questions: [ProductThread.t()],
          answers: [ThreadPost.t()]
        }
  def viewer_community_submissions(user_id, product_id)
      when is_integer(user_id) and user_id > 0 and is_integer(product_id) and product_id > 0 do
    %{
      reviews:
        Repo.all(
          from review in ProductReview,
            where: review.user_id == ^user_id and review.product_id == ^product_id,
            where: review.moderation_status in ^@non_public_owner_statuses,
            order_by: [desc: review.inserted_at, desc: review.id],
            limit: @owner_submission_limit
        ),
      questions:
        Repo.all(
          from question in ProductThread,
            where:
              question.created_by == ^user_id and question.product_id == ^product_id and
                question.kind == :question,
            where: question.moderation_status in ^@non_public_owner_statuses,
            order_by: [desc: question.inserted_at, desc: question.id],
            limit: @owner_submission_limit
        ),
      answers:
        Repo.all(
          from answer in ThreadPost,
            join: question in ProductThread,
            on: question.id == answer.thread_id,
            where: answer.user_id == ^user_id and question.product_id == ^product_id,
            where:
              answer.moderation_status in ^@non_public_owner_statuses or
                (answer.moderation_status == :published and
                   question.moderation_status != :published),
            order_by: [desc: answer.inserted_at, desc: answer.id],
            limit: @owner_submission_limit,
            select: answer
        )
    }
  end

  @spec public_questions_query(pos_integer()) :: Ecto.Query.t()
  def public_questions_query(product_id) do
    from thread in ProductThread,
      where:
        thread.product_id == ^product_id and thread.kind == :question and
          thread.moderation_status == :published,
      order_by: [desc: thread.inserted_at, desc: thread.id],
      preload: [:accepted_post]
  end

  @spec public_answers_query(pos_integer()) :: Ecto.Query.t()
  def public_answers_query(question_id) do
    from post in ThreadPost,
      where: post.thread_id == ^question_id and post.moderation_status == :published,
      order_by: [asc: post.inserted_at, asc: post.id]
  end

  @spec get_public_question(Ecto.UUID.t()) :: ProductThread.t() | nil
  def get_public_question(entropy_id) do
    case public_question_by_entropy(entropy_id) do
      %ProductThread{} = question -> Repo.preload(question, :accepted_post)
      nil -> nil
    end
  end

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
  def moderate(operator_id, type, entropy_id, status, note \\ nil)

  def moderate(operator_id, type, entropy_id, status, note)
      when type in [:review, :question, :answer] and
             status in [:published, :hidden, :rejected] do
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

  def moderate(_operator_id, _type, _entropy_id, _status, _note), do: {:error, :not_found}

  @spec report(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | :rate_limited | Ecto.Changeset.t()}
  def report(reporter_id, type, entropy_id, reason)
      when is_integer(reporter_id) and reporter_id > 0 and
             type in [:review, :question, :answer] and is_binary(entropy_id) do
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

  def report(_reporter_id, _type, _entropy_id, _reason), do: {:error, :not_found}

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
      |> Application.get_env(__MODULE__, [])
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

  defp normalize_pagination(opts) do
    limit =
      opts
      |> Input.pagination_value(:limit, @default_page_limit)
      |> Input.clamp_limit(@default_page_limit, @max_page_limit)

    offset =
      opts
      |> Input.pagination_value(:offset, 0)
      |> Input.clamp_non_negative(0)

    {limit, offset}
  end

  defp parent_update?(attrs) when is_map(attrs) do
    Map.has_key?(attrs, :parent_post_id) or Map.has_key?(attrs, "parent_post_id")
  end

  defp parent_update?(_attrs), do: false

  defp update_post_parent(%ThreadPost{} = post, attrs) do
    Repo.transaction(fn ->
      current_post = Repo.get!(ThreadPost, post.id)

      Repo.one!(
        from thread in ProductThread,
          where: thread.id == ^current_post.thread_id,
          lock: "FOR UPDATE"
      )

      ThreadPost
      |> Repo.get!(post.id)
      |> ThreadPost.changeset(attrs)
      |> validate_post_parent()
      |> Repo.update()
      |> case do
        {:ok, updated_post} -> updated_post
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  defp validate_post_parent(%Ecto.Changeset{valid?: false} = changeset), do: changeset

  defp validate_post_parent(changeset) do
    parent_post_id = Ecto.Changeset.get_field(changeset, :parent_post_id)
    thread_id = Ecto.Changeset.get_field(changeset, :thread_id)
    post_id = changeset.data.id

    case fetch_parent_post(parent_post_id) do
      :no_parent ->
        changeset

      :not_found ->
        Ecto.Changeset.add_error(changeset, :parent_post_id, "does not exist")

      %ThreadPost{thread_id: parent_thread_id} when parent_thread_id != thread_id ->
        Ecto.Changeset.add_error(
          changeset,
          :parent_post_id,
          "must belong to the same thread"
        )

      %ThreadPost{} ->
        if parent_chain_contains_id?(parent_post_id, post_id) do
          Ecto.Changeset.add_error(changeset, :parent_post_id, "cannot create a cycle")
        else
          changeset
        end
    end
  end

  defp fetch_parent_post(nil), do: :no_parent

  defp fetch_parent_post(parent_post_id) do
    case Repo.get(ThreadPost, parent_post_id) do
      nil -> :not_found
      %ThreadPost{} = parent_post -> parent_post
    end
  end

  defp parent_chain_contains_id?(_parent_id, nil), do: false
  defp parent_chain_contains_id?(nil, _target_id), do: false

  defp parent_chain_contains_id?(parent_id, target_id) do
    parent_chain_contains_id?(parent_id, target_id, [])
  end

  defp parent_chain_contains_id?(nil, _target_id, _visited), do: false

  defp parent_chain_contains_id?(parent_id, target_id, visited) do
    cond do
      parent_id == target_id ->
        true

      parent_id in visited ->
        false

      true ->
        case Repo.get(ThreadPost, parent_id) do
          nil ->
            false

          %ThreadPost{parent_post_id: next_parent_id} ->
            parent_chain_contains_id?(next_parent_id, target_id, [parent_id | visited])
        end
    end
  end

  defp drop_client_verified_purchase(attrs) when is_map(attrs) do
    attrs
    |> Map.delete(:verified_purchase)
    |> Map.delete("verified_purchase")
  end

  defp drop_client_verified_purchase(attrs), do: attrs

  defp public_question_by_entropy(entropy_id) do
    case question_by_entropy(entropy_id) do
      %ProductThread{moderation_status: :published} = question -> question
      _ -> nil
    end
  end

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

  defp get_attr_value(attrs, key) when is_map(attrs),
    do: Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
end
