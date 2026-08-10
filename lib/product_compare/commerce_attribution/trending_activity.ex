defmodule ProductCompare.CommerceAttribution.TrendingActivity do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @spec product_ids(keyword()) :: [pos_integer()]
  def product_ids(opts) do
    limit = opts |> Keyword.get(:limit, 6) |> bounded_limit(6)

    opts
    |> candidates_query()
    |> limit(^limit)
    |> exclude(:select)
    |> select([activity], activity.product_id)
    |> Repo.all()
  end

  @spec candidates_query(keyword()) :: Ecto.Query.t()
  def candidates_query(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    days = opts |> Keyword.get(:days, 7) |> bounded_positive(7)
    minimum_identities = opts |> Keyword.get(:minimum_identities, 5) |> bounded_positive(5)
    boundary = DateTime.add(now, -days * 86_400, :second)

    activities =
      CommerceClickSession
      |> join(:inner, [click], offer in MerchantProduct,
        on: offer.id == click.merchant_product_id
      )
      |> where([click, offer], click.inserted_at >= ^boundary and offer.is_active == true)
      |> select([click, offer], %{
        product_id: offer.product_id,
        activity_at: click.inserted_at,
        identity:
          fragment(
            "CASE WHEN ? IS NOT NULL THEN 'u:' || ?::text WHEN ? IS NOT NULL THEN 'a:' || ?::text ELSE NULL END",
            click.user_id,
            click.user_id,
            click.anonymous_id,
            click.anonymous_id
          )
      })

    activities
    |> subquery()
    |> group_by([activity], activity.product_id)
    |> having([activity], count(activity.identity, :distinct) >= ^minimum_identities)
    |> order_by([activity],
      desc: count(activity.identity, :distinct),
      desc: max(activity.activity_at),
      asc: activity.product_id
    )
    |> select([activity], %{
      product_id: activity.product_id,
      identity_count: count(activity.identity, :distinct),
      activity_at: max(activity.activity_at)
    })
  end

  defp bounded_positive(value, _default) when is_integer(value) and value > 0, do: value
  defp bounded_positive(_value, default), do: default

  defp bounded_limit(value, _default) when is_integer(value) and value > 0, do: min(value, 6)
  defp bounded_limit(_value, default), do: default
end
