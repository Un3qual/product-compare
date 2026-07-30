defmodule ProductCompare.Discussions do
  @moduledoc """
  Discussions context for threads, posts, and product reviews.
  """

  alias ProductCompare.Discussions.ContentLifecycle
  alias ProductCompare.Discussions.Moderation
  alias ProductCompare.Discussions.Reads
  alias ProductCompare.Discussions.Submissions
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  defguardp valid_review_submission?(user_id, product_id, attrs, idempotency_key)
            when is_integer(user_id) and user_id > 0 and is_integer(product_id) and
                   product_id > 0 and is_map(attrs) and is_binary(idempotency_key)

  @spec list_threads_for_product(pos_integer(), keyword() | map()) :: [ProductThread.t()]
  def list_threads_for_product(product_id, opts \\ []),
    do: Reads.list_threads_for_product(product_id, opts)

  @spec list_posts_for_thread(pos_integer(), keyword() | map()) :: [ThreadPost.t()]
  def list_posts_for_thread(thread_id, opts \\ []),
    do: Reads.list_posts_for_thread(thread_id, opts)

  @spec create_thread(map()) :: {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def create_thread(attrs), do: ContentLifecycle.create_thread(attrs)

  @spec update_thread(ProductThread.t(), map()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def update_thread(%ProductThread{} = thread, attrs),
    do: ContentLifecycle.update_thread(thread, attrs)

  @spec delete_thread(ProductThread.t()) ::
          {:ok, ProductThread.t()} | {:error, Ecto.Changeset.t()}
  def delete_thread(%ProductThread{} = thread), do: ContentLifecycle.delete_thread(thread)

  @spec create_post(map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def create_post(attrs), do: ContentLifecycle.create_post(attrs)

  @spec update_post(ThreadPost.t(), map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def update_post(%ThreadPost{} = post, attrs), do: ContentLifecycle.update_post(post, attrs)

  @spec delete_post(ThreadPost.t()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def delete_post(%ThreadPost{} = post), do: ContentLifecycle.delete_post(post)

  @spec list_reviews_for_product(pos_integer(), keyword() | map()) :: [ProductReview.t()]
  def list_reviews_for_product(product_id, opts \\ []),
    do: Reads.list_reviews_for_product(product_id, opts)

  @spec create_review(map()) :: {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def create_review(attrs), do: ContentLifecycle.create_review(attrs)

  @spec update_review(ProductReview.t(), map()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def update_review(%ProductReview{} = review, attrs),
    do: ContentLifecycle.update_review(review, attrs)

  @spec delete_review(ProductReview.t()) ::
          {:ok, ProductReview.t()} | {:error, Ecto.Changeset.t()}
  def delete_review(%ProductReview{} = review), do: ContentLifecycle.delete_review(review)

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
      when valid_review_submission?(user_id, product_id, attrs, idempotency_key) do
    Submissions.submit_review(user_id, product_id, attrs, idempotency_key)
  end

  def submit_review(_user_id, _product_id, _attrs, _idempotency_key),
    do: {:error, :invalid_argument}

  @spec list_public_reviews(pos_integer(), keyword()) :: [ProductReview.t()]
  def list_public_reviews(product_id, opts \\ []), do: Reads.list_public_reviews(product_id, opts)

  @spec public_reviews_query(pos_integer()) :: Ecto.Query.t()
  def public_reviews_query(product_id), do: Reads.public_reviews_query(product_id)

  @spec review_summaries([pos_integer()]) :: %{
          optional(pos_integer()) => %{
            count: non_neg_integer(),
            average_rating: Decimal.t() | nil
          }
        }
  def review_summaries(product_ids) when is_list(product_ids),
    do: Reads.review_summaries(product_ids)

  @spec review_summary(pos_integer()) :: %{
          count: non_neg_integer(),
          average_rating: Decimal.t() | nil
        }
  def review_summary(product_id), do: Reads.review_summary(product_id)

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
    Submissions.ask_question(user_id, product_id, attrs, idempotency_key)
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
    Submissions.answer_question(user_id, question_entropy_id, body, idempotency_key)
  end

  def answer_question(_user_id, _question_entropy_id, _body, _idempotency_key),
    do: {:error, :invalid_argument}

  @spec update_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), map()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error,
             :forbidden | :not_found | :invalid_lifecycle | :rate_limited | Ecto.Changeset.t()}
  def update_owned(user_id, type, entropy_id, attrs)
      when is_integer(user_id) and user_id > 0 and type in [:review, :question, :answer] and
             is_binary(entropy_id) and is_map(attrs) do
    Submissions.update_owned(user_id, type, entropy_id, attrs)
  end

  def update_owned(_user_id, _type, _entropy_id, _attrs), do: {:error, :not_found}

  @spec remove_owned(pos_integer(), :review | :question | :answer, Ecto.UUID.t()) ::
          {:ok, ProductReview.t() | ProductThread.t() | ThreadPost.t()}
          | {:error, :forbidden | :not_found | :invalid_lifecycle | Ecto.Changeset.t()}
  def remove_owned(user_id, type, entropy_id)
      when is_integer(user_id) and user_id > 0 and type in [:review, :question, :answer] and
             is_binary(entropy_id) do
    Submissions.remove_owned(user_id, type, entropy_id)
  end

  def remove_owned(_user_id, _type, _entropy_id), do: {:error, :not_found}

  @spec list_public_questions(pos_integer(), keyword()) :: [ProductThread.t()]
  def list_public_questions(product_id, opts \\ []),
    do: Reads.list_public_questions(product_id, opts)

  @spec viewer_community_submissions(pos_integer(), pos_integer()) :: %{
          reviews: [ProductReview.t()],
          questions: [ProductThread.t()],
          answers: [ThreadPost.t()]
        }
  def viewer_community_submissions(user_id, product_id)
      when is_integer(user_id) and user_id > 0 and is_integer(product_id) and product_id > 0 do
    Reads.viewer_community_submissions(user_id, product_id)
  end

  @spec viewer_community_submissions_for_products(pos_integer(), [pos_integer()]) :: %{
          optional(pos_integer()) => %{
            reviews: [ProductReview.t()],
            questions: [ProductThread.t()],
            answers: [ThreadPost.t()]
          }
        }
  def viewer_community_submissions_for_products(user_id, product_ids)
      when is_integer(user_id) and user_id > 0 and is_list(product_ids) do
    Reads.viewer_community_submissions_for_products(user_id, product_ids)
  end

  @spec public_questions_query(pos_integer()) :: Ecto.Query.t()
  def public_questions_query(product_id), do: Reads.public_questions_query(product_id)

  @spec public_answers_query(pos_integer()) :: Ecto.Query.t()
  def public_answers_query(question_id), do: Reads.public_answers_query(question_id)

  @spec public_connection_pages(
          :reviews | :questions | :answers,
          [pos_integer()],
          %{offset: non_neg_integer(), fetch_limit: pos_integer()}
        ) :: %{
          optional(pos_integer()) => [ProductReview.t() | ProductThread.t() | ThreadPost.t()]
        }
  def public_connection_pages(kind, parent_ids, %{offset: offset, fetch_limit: fetch_limit})
      when kind in [:reviews, :questions, :answers] and is_list(parent_ids) and
             is_integer(offset) and offset >= 0 and is_integer(fetch_limit) and fetch_limit > 0 do
    Reads.public_connection_pages(kind, parent_ids, %{offset: offset, fetch_limit: fetch_limit})
  end

  @spec get_public_question(Ecto.UUID.t()) :: ProductThread.t() | nil
  def get_public_question(entropy_id), do: Reads.get_public_question(entropy_id)

  @spec get_public_questions([term()]) :: %{optional(term()) => ProductThread.t() | nil}
  def get_public_questions(entropy_ids) when is_list(entropy_ids),
    do: Reads.get_public_questions(entropy_ids)

  @spec accept_answer(pos_integer(), Ecto.UUID.t(), Ecto.UUID.t()) ::
          {:ok, ProductThread.t()}
          | {:error, :not_found | :forbidden | :answer_not_published}
  def accept_answer(user_id, question_entropy_id, answer_entropy_id),
    do: Moderation.accept_answer(user_id, question_entropy_id, answer_entropy_id)

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
    Moderation.moderate(operator_id, type, entropy_id, status, note)
  end

  def moderate(_operator_id, _type, _entropy_id, _status, _note), do: {:error, :not_found}

  @spec report(pos_integer(), :review | :question | :answer, Ecto.UUID.t(), String.t()) ::
          {:ok, CommunityReport.t()}
          | {:error, :not_found | :already_reported | :rate_limited | Ecto.Changeset.t()}
  def report(reporter_id, type, entropy_id, reason)
      when is_integer(reporter_id) and reporter_id > 0 and
             type in [:review, :question, :answer] and is_binary(entropy_id) do
    Submissions.report(reporter_id, type, entropy_id, reason)
  end

  def report(_reporter_id, _type, _entropy_id, _reason), do: {:error, :not_found}
end
