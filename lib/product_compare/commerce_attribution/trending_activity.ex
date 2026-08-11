defmodule ProductCompare.CommerceAttribution.TrendingActivity do
  @moduledoc false

  import Ecto.Query

  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @spec candidates_query(keyword()) :: Ecto.Query.t()
  def candidates_query(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    days = opts |> Keyword.get(:days, 7) |> bounded_positive(7)
    minimum_identities = opts |> Keyword.get(:minimum_identities, 5) |> bounded_positive(5)
    boundary = DateTime.add(now, -days * 86_400, :second)

    CommerceClickSession
    |> join(:inner, [click], offer in MerchantProduct, on: offer.id == click.merchant_product_id)
    |> where([click, offer], click.inserted_at >= ^boundary and offer.is_active == true)
    |> group_by([_click, offer], offer.product_id)
    |> having(
      [click, _offer],
      count(click.user_id, :distinct) + count(click.anonymous_visitor_id, :distinct) >=
        ^minimum_identities
    )
    |> order_by([click, offer],
      desc: count(click.user_id, :distinct) + count(click.anonymous_visitor_id, :distinct),
      desc: max(click.inserted_at),
      asc: offer.product_id
    )
    |> select([click, offer], %{
      product_id: offer.product_id,
      identity_count:
        count(click.user_id, :distinct) + count(click.anonymous_visitor_id, :distinct),
      activity_at: max(click.inserted_at)
    })
  end

  defp bounded_positive(value, _default) when is_integer(value) and value > 0, do: value
  defp bounded_positive(_value, default), do: default
end
