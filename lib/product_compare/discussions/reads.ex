defmodule ProductCompare.Discussions.Reads do
  @moduledoc false

  alias ProductCompare.Input
  alias ProductCompare.Discussions.Reads.Connections
  alias ProductCompare.Discussions.Reads.Legacy
  alias ProductCompare.Discussions.Reads.Nodes
  alias ProductCompare.Discussions.Reads.PublicContent
  alias ProductCompare.Discussions.Reads.ViewerSubmissions
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @default_page_limit 50
  @max_page_limit 200

  @spec list_threads_for_product(pos_integer(), keyword() | map()) :: [ProductThread.t()]
  def list_threads_for_product(product_id, opts \\ []) do
    Legacy.list_threads_for_product(product_id, normalize_pagination(opts))
  end

  @spec list_posts_for_thread(pos_integer(), keyword() | map()) :: [ThreadPost.t()]
  def list_posts_for_thread(thread_id, opts \\ []) do
    Legacy.list_posts_for_thread(thread_id, normalize_pagination(opts))
  end

  @spec list_reviews_for_product(pos_integer(), keyword() | map()) :: [ProductReview.t()]
  def list_reviews_for_product(product_id, opts \\ []) do
    Legacy.list_reviews_for_product(product_id, normalize_pagination(opts))
  end

  @spec list_public_reviews(pos_integer(), keyword()) :: [ProductReview.t()]
  def list_public_reviews(product_id, opts \\ []) do
    PublicContent.list_reviews(product_id, normalize_pagination(opts))
  end

  @spec public_reviews_query(pos_integer()) :: Ecto.Query.t()
  def public_reviews_query(product_id) do
    PublicContent.reviews_query(product_id)
  end

  @spec review_summaries([pos_integer()]) :: %{
          optional(pos_integer()) => %{
            count: non_neg_integer(),
            average_rating: Decimal.t() | nil
          }
        }
  def review_summaries(product_ids) when is_list(product_ids) do
    PublicContent.review_summaries(product_ids)
  end

  @spec review_summary(pos_integer()) :: %{
          count: non_neg_integer(),
          average_rating: Decimal.t() | nil
        }
  def review_summary(product_id) do
    PublicContent.review_summary(product_id)
  end

  @spec list_public_questions(pos_integer(), keyword()) :: [ProductThread.t()]
  def list_public_questions(product_id, opts \\ []) do
    PublicContent.list_questions(product_id, normalize_pagination(opts))
  end

  @spec viewer_community_submissions(pos_integer(), pos_integer()) :: %{
          reviews: [ProductReview.t()],
          questions: [ProductThread.t()],
          answers: [ThreadPost.t()]
        }
  def viewer_community_submissions(user_id, product_id)
      when is_integer(user_id) and user_id > 0 and is_integer(product_id) and product_id > 0 do
    ViewerSubmissions.for_product(user_id, product_id)
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
    ViewerSubmissions.for_products(user_id, product_ids)
  end

  @spec public_questions_query(pos_integer()) :: Ecto.Query.t()
  def public_questions_query(product_id) do
    PublicContent.questions_query(product_id)
  end

  @spec public_answers_query(pos_integer()) :: Ecto.Query.t()
  def public_answers_query(question_id) do
    PublicContent.answers_query(question_id)
  end

  @spec public_connection_pages(
          :reviews | :questions | :answers,
          [pos_integer()],
          %{offset: non_neg_integer(), fetch_limit: pos_integer()}
        ) :: %{
          optional(pos_integer()) => [ProductReview.t() | ProductThread.t() | ThreadPost.t()]
        }
  def public_connection_pages(kind, parent_ids, %{offset: offset, fetch_limit: fetch_limit}) do
    Connections.pages(kind, parent_ids, %{offset: offset, fetch_limit: fetch_limit})
  end

  @spec get_public_question(Ecto.UUID.t()) :: ProductThread.t() | nil
  def get_public_question(entropy_id) do
    PublicContent.get_question(entropy_id)
  end

  @spec get_public_questions([term()]) :: %{optional(term()) => ProductThread.t() | nil}
  def get_public_questions(entropy_ids) when is_list(entropy_ids) do
    PublicContent.get_questions(entropy_ids)
  end

  @spec get_visible_nodes(
          :product_review | :product_question | :product_answer,
          [term()],
          pos_integer() | nil
        ) :: %{optional(term()) => ProductReview.t() | ProductThread.t() | ThreadPost.t() | nil}
  def get_visible_nodes(type, entropy_ids, viewer_id) do
    Nodes.get_visible(type, entropy_ids, viewer_id)
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
end
