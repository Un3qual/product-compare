defmodule ProductCompare.Alerts.HomeRelevance do
  @moduledoc false

  import Ecto.Query

  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.{Product, SavedComparisonItem, SavedComparisonSet}

  @limit 6

  defmacrop relevance_candidate(product_id, merchant_product_id, reason_rank, watch_target) do
    quote do
      %{
        product_id: unquote(product_id),
        merchant_product_id: unquote(merchant_product_id),
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

  defmacrop null_bigint do
    quote do
      type(fragment("NULL"), :integer)
    end
  end

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
          watch.rule_type == :target_price and watch.currency == ^"USD" and
          not is_nil(watch.target_amount)
      )
      |> group_by([watch], [watch.product_id, watch.merchant_product_id])
      |> select(
        [watch],
        relevance_candidate(
          watch.product_id,
          watch.merchant_product_id,
          0,
          min(watch.target_amount)
        )
      )

    saved_candidates =
      SavedComparisonSet
      |> join(:inner, [set], item in SavedComparisonItem,
        on: item.saved_comparison_set_id == set.id
      )
      |> where([set], set.user_id == ^user_id)
      |> group_by([_set, item], item.product_id)
      |> select(
        [_set, item],
        relevance_candidate(item.product_id, null_bigint(), 1, null_decimal())
      )

    current_candidates =
      Product
      |> where([product], product.id in ^current_product_ids)
      |> select(
        [product],
        relevance_candidate(product.id, null_bigint(), 2, null_decimal())
      )

    watch_candidates
    |> union_all(^saved_candidates)
    |> union_all(^current_candidates)
  end

  def candidates_query(_user_id, _current_product_ids) do
    Product
    |> where([product], false)
    |> select(
      [product],
      relevance_candidate(product.id, null_bigint(), 2, null_decimal())
    )
  end
end
