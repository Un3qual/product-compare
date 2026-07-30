defmodule ProductCompare.Discussions.Reads.Connections do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  @spec pages(
          :reviews | :questions | :answers,
          [pos_integer()],
          %{offset: non_neg_integer(), fetch_limit: pos_integer()}
        ) :: %{
          optional(pos_integer()) => [ProductReview.t() | ProductThread.t() | ThreadPost.t()]
        }
  def pages(kind, parent_ids, %{offset: offset, fetch_limit: fetch_limit}) do
    parent_ids = parent_ids |> Enum.filter(&valid_parent_id?/1) |> Enum.uniq()
    empty_pages = Map.new(parent_ids, &{&1, []})

    case parent_ids do
      [] ->
        empty_pages

      _ ->
        kind
        |> page_query(parent_ids, offset, fetch_limit)
        |> Repo.all()
        |> Enum.group_by(&parent_id(kind, &1))
        |> then(&Map.merge(empty_pages, &1))
    end
  end

  defp page_query(:reviews, parent_ids, offset, fetch_limit) do
    ProductReview
    |> published_page_query(parent_ids, :product_id, :desc, offset, fetch_limit)
  end

  defp page_query(:questions, parent_ids, offset, fetch_limit) do
    ProductThread
    |> published_page_query(parent_ids, :product_id, :desc, offset, fetch_limit)
    |> join(:left, [question, _ranked], accepted_post in assoc(question, :accepted_post))
    |> preload([_question, _ranked, accepted_post], accepted_post: accepted_post)
  end

  defp page_query(:answers, parent_ids, offset, fetch_limit) do
    ThreadPost
    |> published_page_query(parent_ids, :thread_id, :asc, offset, fetch_limit)
  end

  defp published_page_query(
         query,
         parent_ids,
         parent_field,
         sort_direction,
         offset,
         fetch_limit
       ) do
    ranked_records =
      query
      |> where(
        [record],
        field(record, ^parent_field) in ^parent_ids and
          record.moderation_status == :published
      )
      |> windows(
        [record],
        public_connection_page: [
          partition_by: field(record, ^parent_field),
          order_by: [
            {^sort_direction, record.inserted_at},
            {^sort_direction, record.id}
          ]
        ]
      )
      |> select([record], %{
        id: record.id,
        row_number: over(row_number(), :public_connection_page)
      })

    query
    |> join(:inner, [record], ranked in subquery(ranked_records), on: ranked.id == record.id)
    |> where(
      [_record, ranked],
      ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
    )
    |> order_by(
      [record, _ranked],
      [
        {:asc, field(record, ^parent_field)},
        {^sort_direction, record.inserted_at},
        {^sort_direction, record.id}
      ]
    )
  end

  defp parent_id(:reviews, %ProductReview{product_id: product_id}), do: product_id
  defp parent_id(:questions, %ProductThread{product_id: product_id}), do: product_id
  defp parent_id(:answers, %ThreadPost{thread_id: thread_id}), do: thread_id
  defp valid_parent_id?(parent_id), do: is_integer(parent_id) and parent_id > 0
end
