defmodule ProductCompare.Discussions do
  @moduledoc """
  Discussions context for threads, posts, and product reviews.
  """

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @default_page_limit 50
  @max_page_limit 200

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
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def submit_review(user_id, product_id, attrs) do
    attrs = %{
      user_id: user_id,
      product_id: product_id,
      merchant_product_id: get_attr_value(attrs, :merchant_product_id),
      rating: get_attr_value(attrs, :rating),
      title: get_attr_value(attrs, :title),
      body_md: get_attr_value(attrs, :body),
      moderation_status: :pending
    }

    case create_review(attrs) do
      {:ok, review} -> {:ok, Repo.get!(ProductReview, review.id)}
      error -> error
    end
  end

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
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def ask_question(user_id, product_id, attrs) do
    case create_thread(%{
           product_id: product_id,
           created_by: user_id,
           title: get_attr_value(attrs, :title),
           body_md: get_attr_value(attrs, :body),
           kind: :question,
           moderation_status: :pending
         }) do
      {:ok, thread} -> {:ok, Repo.get!(ProductThread, thread.id)}
      error -> error
    end
  end

  @spec answer_question(pos_integer(), Ecto.UUID.t(), String.t()) ::
          {:ok, ThreadPost.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def answer_question(user_id, question_entropy_id, body) do
    with %ProductThread{} = question <- public_question_by_entropy(question_entropy_id),
         {:ok, post} <-
           create_post(%{
             thread_id: question.id,
             user_id: user_id,
             body_md: body,
             moderation_status: :pending
           }) do
      {:ok, Repo.get!(ThreadPost, post.id)}
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

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
          | {:error, :forbidden | :not_found | Ecto.Changeset.t()}
  def moderate(operator_id, type, entropy_id, status, note \\ nil)

  def moderate(operator_id, type, entropy_id, status, note)
      when type in [:review, :question, :answer] and
             status in [:published, :hidden, :rejected] do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    with %User{is_operator: true} <- Repo.get(User, operator_id),
         record when not is_nil(record) <- moderation_record(type, entropy_id) do
      moderate_record(record, status, operator_id, note, now)
    else
      %User{} -> {:error, :forbidden}
      nil -> {:error, :not_found}
    end
  end

  def moderate(_operator_id, _type, _entropy_id, _status, _note), do: {:error, :not_found}

  @spec report(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | Ecto.Changeset.t()}
  def report(reporter_id, type, entropy_id, reason) do
    with record when not is_nil(record) <- moderation_record(type, entropy_id) do
      target =
        case type do
          :review -> %{review_id: record.id}
          :question -> %{thread_id: record.id}
          :answer -> %{post_id: record.id}
        end

      %CommunityReport{}
      |> CommunityReport.changeset(Map.merge(target, %{reporter_id: reporter_id, reason: reason}))
      |> Repo.insert()
      |> case do
        {:error, %Ecto.Changeset{errors: errors}} = error ->
          if Enum.any?(errors, fn {_field, {_message, opts}} -> opts[:constraint] == :unique end),
            do: {:error, :already_reported},
            else: error

        result ->
          result
      end
    else
      nil -> {:error, :not_found}
    end
  end

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

  defp moderate_record(%ThreadPost{} = answer, status, moderator_id, note, now) do
    Repo.transaction(fn ->
      question =
        Repo.one(
          from question in ProductThread,
            where: question.id == ^answer.thread_id,
            lock: "FOR UPDATE"
        )

      if is_nil(question), do: Repo.rollback(:not_found)

      persisted_answer =
        Repo.one(
          from post in ThreadPost,
            where: post.id == ^answer.id and post.thread_id == ^question.id,
            lock: "FOR UPDATE"
        )

      if is_nil(persisted_answer), do: Repo.rollback(:not_found)

      updated_answer =
        persisted_answer
        |> moderation_changeset(status, moderator_id, note, now)
        |> update_or_rollback()

      if status != :published and question.accepted_post_id == persisted_answer.id do
        question
        |> Ecto.Changeset.change(accepted_post_id: nil)
        |> update_or_rollback()
      end

      updated_answer
    end)
  end

  defp moderate_record(record, status, moderator_id, note, now) do
    record
    |> moderation_changeset(status, moderator_id, note, now)
    |> Repo.update()
  end

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

  defp get_attr_value(_attrs, _key), do: nil
end
