defmodule ProductCompare.CommerceAttribution.TrendingActivity do
  @moduledoc false

  import Ecto.Query

  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.Pricing.MerchantProduct

  defmacrop count_distinct_identities(user_id, anonymous_visitor_id) do
    quote do
      filter(
        count(
          fragment("ROW(?, ?)", unquote(user_id), unquote(anonymous_visitor_id)),
          :distinct
        ),
        not is_nil(unquote(user_id)) or not is_nil(unquote(anonymous_visitor_id))
      )
    end
  end

  @spec candidates_query(keyword()) :: Ecto.Query.t()
  def candidates_query(opts) do
    {from, to} = activity_bounds(opts)
    minimum_identities = opts |> Keyword.get(:minimum_identities, 5) |> bounded_positive(5)

    CommerceClickSession
    |> join(:inner, [click], offer in MerchantProduct, on: offer.id == click.merchant_product_id)
    |> where(
      [click, offer],
      click.inserted_at >= ^from and click.inserted_at <= ^to and offer.is_active == true
    )
    |> group_by([_click, offer], offer.product_id)
    |> having(
      [click, _offer],
      count_distinct_identities(click.user_id, click.anonymous_visitor_id) >=
        ^minimum_identities
    )
    |> select([click, offer], %{
      product_id: offer.product_id,
      identity_count: count_distinct_identities(click.user_id, click.anonymous_visitor_id),
      activity_at: max(click.inserted_at)
    })
  end

  defp activity_bounds(opts) do
    to = Keyword.get(opts, :to, Keyword.get(opts, :now, DateTime.utc_now()))
    days = opts |> Keyword.get(:days, 7) |> bounded_positive(7)
    from = Keyword.get(opts, :from, DateTime.add(to, -days * 86_400, :second))

    if DateTime.compare(from, to) == :gt do
      raise ArgumentError, "activity range from must not be after to"
    end

    {from, to}
  end

  defp bounded_positive(value, _default) when is_integer(value) and value > 0, do: value
  defp bounded_positive(_value, default), do: default
end
