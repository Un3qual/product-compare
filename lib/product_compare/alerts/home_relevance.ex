defmodule ProductCompare.Alerts.HomeRelevance do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.{SavedComparisonItem, SavedComparisonSet}

  @spec relevance(pos_integer()) :: %{
          watch_targets: %{optional(pos_integer()) => Decimal.t()},
          saved_product_ids: [pos_integer()]
        }
  def relevance(user_id) when is_integer(user_id) and user_id > 0 do
    %{watch_targets: watch_targets(user_id), saved_product_ids: saved_product_ids(user_id)}
  end

  def relevance(_user_id), do: %{watch_targets: %{}, saved_product_ids: []}

  defp watch_targets(user_id) do
    PriceWatchRule
    |> where(
      [watch],
      watch.user_id == ^user_id and watch.enabled == true and watch.rule_type == :target_price
    )
    |> where([watch], not is_nil(watch.target_amount))
    |> order_by([watch], asc: watch.product_id, asc: watch.target_amount, asc: watch.id)
    |> select([watch], {watch.product_id, watch.target_amount})
    |> Repo.all()
    |> Enum.reduce(%{}, fn {product_id, target_amount}, targets ->
      Map.put_new(targets, product_id, target_amount)
    end)
  end

  # Saved comparison persistence belongs to Catalog. This read joins those owner-scoped
  # rows here because the approved home contract exposes one relevance result.
  defp saved_product_ids(user_id) do
    SavedComparisonSet
    |> join(:inner, [set], item in SavedComparisonItem,
      on: item.saved_comparison_set_id == set.id
    )
    |> where([set], set.user_id == ^user_id)
    |> order_by([set, item],
      desc: set.inserted_at,
      desc: set.id,
      asc: item.position,
      asc: item.id
    )
    |> select([_set, item], item.product_id)
    |> Repo.all()
    |> Enum.uniq()
  end
end
