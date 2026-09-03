defmodule ProductCompare.Discussions.Reads.PublicContent do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec list_reviews(pos_integer(), {pos_integer(), non_neg_integer()}) :: [ProductReview.t()]
  def list_reviews(product_id, {limit, offset}) do
    product_id
    |> reviews_query()
    |> limit(^limit)
    |> offset(^offset)
    |> Repo.all()
  end

  @spec reviews_query(pos_integer()) :: Ecto.Query.t()
  def reviews_query(product_id) do
    from review in ProductReview,
      where: review.product_id == ^product_id and review.moderation_status == :published,
      order_by: [desc: review.inserted_at, desc: review.id]
  end

  @spec review_summaries([pos_integer()]) :: %{
          optional(pos_integer()) => %{
            count: non_neg_integer(),
            average_rating: Decimal.t() | nil
          }
        }
  def review_summaries(product_ids) do
    product_ids = product_ids |> Enum.filter(&valid_product_id?/1) |> Enum.uniq()
    summaries = Map.new(product_ids, &{&1, zero_review_summary()})

    if product_ids == [] do
      summaries
    else
      ProductReview
      |> where(
        [review],
        review.product_id in ^product_ids and review.moderation_status == :published
      )
      |> group_by([review], review.product_id)
      |> select([review], {review.product_id, count(review.id), avg(review.rating)})
      |> Repo.all()
      |> Enum.reduce(summaries, fn {product_id, count, average}, acc ->
        Map.put(acc, product_id, %{
          count: count,
          average_rating: average && Decimal.round(average, 2)
        })
      end)
    end
  end

  @spec review_summary(pos_integer()) :: %{
          count: non_neg_integer(),
          average_rating: Decimal.t() | nil
        }
  def review_summary(product_id) do
    review_summaries([product_id])
    |> Map.get(product_id, zero_review_summary())
  end

  @spec list_questions(pos_integer(), {pos_integer(), non_neg_integer()}) :: [ProductThread.t()]
  def list_questions(product_id, {limit, offset}) do
    published_posts =
      from post in ThreadPost,
        where: post.moderation_status == :published,
        order_by: [asc: post.inserted_at, asc: post.id]

    Repo.all(
      from thread in ProductThread,
        where: thread.product_id == ^product_id and thread.moderation_status == :published,
        order_by: [desc: thread.inserted_at, desc: thread.id],
        limit: ^limit,
        offset: ^offset,
        preload: [posts: ^published_posts]
    )
  end

  @spec questions_query(pos_integer()) :: Ecto.Query.t()
  def questions_query(product_id) do
    from thread in ProductThread,
      where: thread.product_id == ^product_id and thread.moderation_status == :published,
      order_by: [desc: thread.inserted_at, desc: thread.id],
      preload: [:accepted_post]
  end

  @spec answers_query(pos_integer()) :: Ecto.Query.t()
  def answers_query(question_id) do
    from post in ThreadPost,
      where: post.thread_id == ^question_id and post.moderation_status == :published,
      order_by: [asc: post.inserted_at, asc: post.id]
  end

  @spec get_question(Ecto.UUID.t()) :: ProductThread.t() | nil
  def get_question(entropy_id) do
    entropy_id
    |> List.wrap()
    |> get_questions()
    |> Map.get(entropy_id)
  end

  @spec get_questions([term()]) :: %{optional(term()) => ProductThread.t() | nil}
  def get_questions(entropy_ids) do
    Input.uuid_lookup_results(entropy_ids, fn validated_entropy_ids ->
      ProductThread
      |> where(
        [question],
        question.entropy_id in ^validated_entropy_ids and
          question.moderation_status == :published
      )
      |> preload(:accepted_post)
      |> Repo.all()
    end)
  end

  defp valid_product_id?(product_id), do: is_integer(product_id) and product_id > 0
  defp zero_review_summary, do: %{count: 0, average_rating: nil}
end
