defmodule ProductCompare.Discussions.Reads.ViewerSubmissions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @owner_submission_limit 50
  @non_public_owner_statuses [:pending, :hidden, :rejected]

  @spec for_product(pos_integer(), pos_integer()) :: %{
          reviews: [ProductReview.t()],
          questions: [ProductThread.t()],
          answers: [ThreadPost.t()]
        }
  def for_product(user_id, product_id) do
    user_id
    |> for_products([product_id])
    |> Map.fetch!(product_id)
  end

  @spec for_products(pos_integer(), [pos_integer()]) :: %{
          optional(pos_integer()) => %{
            reviews: [ProductReview.t()],
            questions: [ProductThread.t()],
            answers: [ThreadPost.t()]
          }
        }
  def for_products(user_id, product_ids) do
    product_ids = product_ids |> Enum.filter(&valid_product_id?/1) |> Enum.uniq()

    case product_ids do
      [] ->
        %{}

      _ ->
        reviews = owner_review_submissions(user_id, product_ids)
        questions = owner_question_submissions(user_id, product_ids)
        answers = owner_answer_submissions(user_id, product_ids)

        Map.new(product_ids, fn product_id ->
          {product_id,
           %{
             reviews: Map.get(reviews, product_id, []),
             questions: Map.get(questions, product_id, []),
             answers: Map.get(answers, product_id, [])
           }}
        end)
    end
  end

  defp owner_review_submissions(user_id, product_ids) do
    ProductReview
    |> where(
      [review],
      review.user_id == ^user_id and review.product_id in ^product_ids and
        review.moderation_status in ^@non_public_owner_statuses
    )
    |> owner_partitioned_submissions(:product_id)
    |> Repo.all()
    |> Enum.group_by(& &1.product_id)
  end

  defp owner_question_submissions(user_id, product_ids) do
    ProductThread
    |> where(
      [question],
      question.created_by == ^user_id and question.product_id in ^product_ids and
        question.moderation_status in ^@non_public_owner_statuses
    )
    |> owner_partitioned_submissions(:product_id)
    |> Repo.all()
    |> Enum.group_by(& &1.product_id)
  end

  defp owner_answer_submissions(user_id, product_ids) do
    ranked_answers =
      ThreadPost
      |> join(:inner, [answer], question in ProductThread, on: question.id == answer.thread_id)
      |> where(
        [answer, question],
        answer.user_id == ^user_id and question.product_id in ^product_ids
      )
      |> where(
        [answer, question],
        answer.moderation_status in ^@non_public_owner_statuses or
          (answer.moderation_status == :published and
             question.moderation_status != :published)
      )
      |> windows(
        [answer, question],
        owner_submission_page: [
          partition_by: question.product_id,
          order_by: [desc: answer.inserted_at, desc: answer.id]
        ]
      )
      |> select([answer, question], %{
        id: answer.id,
        product_id: question.product_id,
        row_number: over(row_number(), :owner_submission_page)
      })

    ThreadPost
    |> join(:inner, [answer], ranked in subquery(ranked_answers), on: ranked.id == answer.id)
    |> where([_answer, ranked], ranked.row_number <= @owner_submission_limit)
    |> order_by([answer, ranked],
      asc: ranked.product_id,
      desc: answer.inserted_at,
      desc: answer.id
    )
    |> select([answer, ranked], {ranked.product_id, answer})
    |> Repo.all()
    |> Enum.group_by(fn {product_id, _answer} -> product_id end, fn {_product_id, answer} ->
      answer
    end)
  end

  defp owner_partitioned_submissions(query, parent_field) do
    ranked_records =
      query
      |> windows(
        [record],
        owner_submission_page: [
          partition_by: field(record, ^parent_field),
          order_by: [desc: record.inserted_at, desc: record.id]
        ]
      )
      |> select([record], %{
        id: record.id,
        row_number: over(row_number(), :owner_submission_page)
      })

    query
    |> join(:inner, [record], ranked in subquery(ranked_records), on: ranked.id == record.id)
    |> where([_record, ranked], ranked.row_number <= @owner_submission_limit)
    |> order_by([record, _ranked],
      asc: field(record, ^parent_field),
      desc: record.inserted_at,
      desc: record.id
    )
  end

  defp valid_product_id?(product_id), do: is_integer(product_id) and product_id > 0
end
