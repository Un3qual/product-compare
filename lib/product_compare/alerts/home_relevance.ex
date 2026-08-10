defmodule ProductCompare.Alerts.HomeRelevance do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.{Product, SavedComparisonItem, SavedComparisonSet}

  @limit 6

  defmacrop relevance_candidate(product_id, reason_rank, watch_target) do
    quote do
      %{
        product_id: unquote(product_id),
        reason_rank: unquote(reason_rank),
        watch_target: unquote(watch_target)
      }
    end
  end

  defmacrop null_decimal do
    quote do
      type(fragment("NULL"), :decimal)
    end
  end

  @spec relevance(pos_integer()) :: %{
          watch_targets: %{optional(pos_integer()) => Decimal.t()},
          saved_product_ids: [pos_integer()]
        }
  def relevance(user_id) when is_integer(user_id) and user_id > 0 do
    %{watch_targets: watch_targets(user_id), saved_product_ids: saved_product_ids(user_id)}
  end

  def relevance(_user_id), do: %{watch_targets: %{}, saved_product_ids: []}

  @spec candidates_query(pos_integer(), [pos_integer()]) :: Ecto.Query.t()
  def candidates_query(user_id, current_product_ids)
      when is_integer(user_id) and user_id > 0 and is_list(current_product_ids) do
    current_product_ids =
      current_product_ids
      |> Enum.filter(&(is_integer(&1) and &1 > 0))
      |> Enum.uniq()
      |> Enum.take(@limit)

    watch_candidates =
      PriceWatchRule
      |> where(
        [watch],
        watch.user_id == ^user_id and watch.enabled == true and
          watch.rule_type == :target_price and not is_nil(watch.target_amount)
      )
      |> group_by([watch], watch.product_id)
      |> select([watch], relevance_candidate(watch.product_id, 0, min(watch.target_amount)))

    saved_candidates =
      SavedComparisonSet
      |> join(:inner, [set], item in SavedComparisonItem,
        on: item.saved_comparison_set_id == set.id
      )
      |> where([set], set.user_id == ^user_id)
      |> group_by([_set, item], item.product_id)
      |> select([_set, item], relevance_candidate(item.product_id, 1, null_decimal()))

    current_candidates =
      Product
      |> where([product], product.id in ^current_product_ids)
      |> select([product], relevance_candidate(product.id, 2, null_decimal()))

    candidates =
      watch_candidates
      |> union_all(^saved_candidates)
      |> union_all(^current_candidates)

    candidates
    |> subquery()
    |> group_by([candidate], candidate.product_id)
    |> select(
      [candidate],
      relevance_candidate(
        candidate.product_id,
        min(candidate.reason_rank),
        type(
          fragment(
            "min(?) FILTER (WHERE ? = 0)",
            candidate.watch_target,
            candidate.reason_rank
          ),
          :decimal
        )
      )
    )
  end

  def candidates_query(_user_id, _current_product_ids) do
    Product
    |> where([product], false)
    |> select([product], relevance_candidate(product.id, 2, null_decimal()))
  end

  defp watch_targets(user_id) do
    PriceWatchRule
    |> where(
      [watch],
      watch.user_id == ^user_id and watch.enabled == true and watch.rule_type == :target_price
    )
    |> where([watch], not is_nil(watch.target_amount))
    |> group_by([watch], watch.product_id)
    |> order_by([watch], asc: watch.product_id)
    |> select([watch], {watch.product_id, min(watch.target_amount)})
    |> limit(^@limit)
    |> Repo.all()
    |> Map.new()
  end

  # Saved comparison persistence belongs to Catalog. This read joins those owner-scoped
  # rows here because the approved home contract exposes one relevance result.
  defp saved_product_ids(user_id) do
    ranked_items =
      SavedComparisonSet
      |> join(:inner, [set], item in SavedComparisonItem,
        on: item.saved_comparison_set_id == set.id
      )
      |> where([set], set.user_id == ^user_id)
      |> windows([set, item],
        saved_product: [
          partition_by: item.product_id,
          order_by: [
            desc: set.inserted_at,
            desc: set.id,
            asc: item.position,
            asc: item.id
          ]
        ]
      )
      |> select([set, item], %{
        product_id: item.product_id,
        set_inserted_at: set.inserted_at,
        set_id: set.id,
        item_position: item.position,
        item_id: item.id,
        rank: over(row_number(), :saved_product)
      })

    ranked_items
    |> subquery()
    |> where([item], item.rank == 1)
    |> order_by([item],
      desc: item.set_inserted_at,
      desc: item.set_id,
      asc: item.item_position,
      asc: item.item_id
    )
    |> select([item], item.product_id)
    |> limit(^@limit)
    |> Repo.all()
  end
end
