defmodule ProductCompare.CommerceAttribution.TrendingActivity do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @spec product_ids(keyword()) :: [pos_integer()]
  def product_ids(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    days = opts |> Keyword.get(:days, 7) |> bounded_positive(7)
    minimum_identities = opts |> Keyword.get(:minimum_identities, 5) |> bounded_positive(5)
    boundary = DateTime.add(now, -days * 86_400, :second)

    CommerceClickSession
    |> join(:inner, [click], offer in MerchantProduct, on: offer.id == click.merchant_product_id)
    |> where([click, offer], click.inserted_at >= ^boundary and offer.is_active == true)
    |> group_by([_click, offer], offer.product_id)
    |> having(
      [click],
      fragment(
        "COUNT(DISTINCT CASE WHEN ? IS NOT NULL THEN 'u:' || ?::text WHEN ? IS NOT NULL THEN 'a:' || ? ELSE NULL END)",
        click.user_id,
        click.user_id,
        click.anonymous_id,
        click.anonymous_id
      ) >= ^minimum_identities
    )
    |> order_by([click, offer],
      desc:
        fragment(
          "COUNT(DISTINCT CASE WHEN ? IS NOT NULL THEN 'u:' || ?::text WHEN ? IS NOT NULL THEN 'a:' || ? ELSE NULL END)",
          click.user_id,
          click.user_id,
          click.anonymous_id,
          click.anonymous_id
        ),
      desc: max(click.inserted_at),
      asc: offer.product_id
    )
    |> select([_click, offer], offer.product_id)
    |> Repo.all()
  end

  defp bounded_positive(value, _default) when is_integer(value) and value > 0, do: value
  defp bounded_positive(_value, default), do: default
end
