defmodule ProductCompare.Discussions.Reads.Legacy do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec list_threads_for_product(pos_integer(), {pos_integer(), non_neg_integer()}) ::
          [ProductThread.t()]
  def list_threads_for_product(product_id, {limit, offset}) do
    ProductThread
    |> where([thread], thread.product_id == ^product_id)
    |> order_by([thread], desc: thread.inserted_at, desc: thread.id)
    |> paginated_results(limit, offset)
  end

  @spec list_posts_for_thread(pos_integer(), {pos_integer(), non_neg_integer()}) ::
          [ThreadPost.t()]
  def list_posts_for_thread(thread_id, {limit, offset}) do
    ThreadPost
    |> where([post], post.thread_id == ^thread_id)
    |> order_by([post], asc: post.inserted_at, asc: post.id)
    |> paginated_results(limit, offset)
  end

  @spec list_reviews_for_product(pos_integer(), {pos_integer(), non_neg_integer()}) ::
          [ProductReview.t()]
  def list_reviews_for_product(product_id, {limit, offset}) do
    Repo.all(
      from review in ProductReview,
        where: review.product_id == ^product_id,
        order_by: [desc: review.inserted_at, desc: review.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  defp paginated_results(query, limit, offset) do
    query
    |> limit(^limit)
    |> offset(^offset)
    |> Repo.all()
  end
end
