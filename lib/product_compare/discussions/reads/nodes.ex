defmodule ProductCompare.Discussions.Reads.Nodes do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @retained_statuses [:pending, :published, :hidden, :rejected]

  @spec get_visible(
          :product_review | :product_question | :product_answer,
          [term()],
          pos_integer() | nil
        ) :: %{optional(term()) => ProductReview.t() | ProductThread.t() | ThreadPost.t() | nil}
  def get_visible(type, entropy_ids, viewer_id) do
    Input.uuid_lookup_results(entropy_ids, fn validated_entropy_ids ->
      type
      |> visible_query(validated_entropy_ids, viewer_id)
      |> Repo.all()
    end)
  end

  defp visible_query(:product_review, entropy_ids, nil) do
    ProductReview
    |> where([review], review.entropy_id in ^entropy_ids)
    |> where([review], review.moderation_status == :published)
  end

  defp visible_query(:product_review, entropy_ids, viewer_id) do
    ProductReview
    |> where([review], review.entropy_id in ^entropy_ids)
    |> where(
      [review],
      review.moderation_status == :published or
        (review.user_id == ^viewer_id and review.moderation_status in ^@retained_statuses)
    )
  end

  defp visible_query(:product_question, entropy_ids, nil) do
    ProductThread
    |> where([question], question.entropy_id in ^entropy_ids)
    |> where([question], question.moderation_status == :published)
    |> preload(:accepted_post)
  end

  defp visible_query(:product_question, entropy_ids, viewer_id) do
    ProductThread
    |> where([question], question.entropy_id in ^entropy_ids)
    |> where(
      [question],
      question.moderation_status == :published or
        (question.created_by == ^viewer_id and question.moderation_status in ^@retained_statuses)
    )
    |> preload(:accepted_post)
  end

  defp visible_query(:product_answer, entropy_ids, nil) do
    ThreadPost
    |> join(:inner, [answer], question in ProductThread, on: question.id == answer.thread_id)
    |> where([answer, _question], answer.entropy_id in ^entropy_ids)
    |> where(
      [answer, question],
      answer.moderation_status == :published and question.moderation_status == :published
    )
  end

  defp visible_query(:product_answer, entropy_ids, viewer_id) do
    ThreadPost
    |> join(:inner, [answer], question in ProductThread, on: question.id == answer.thread_id)
    |> where([answer, _question], answer.entropy_id in ^entropy_ids)
    |> where(
      [answer, question],
      (answer.moderation_status == :published and
         question.moderation_status == :published) or
        (answer.user_id == ^viewer_id and answer.moderation_status in ^@retained_statuses)
    )
  end
end
