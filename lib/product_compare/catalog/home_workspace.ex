defmodule ProductCompare.Catalog.HomeWorkspace do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.{MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  @max_selection 3

  @spec product_candidates(keyword()) :: [Product.t()]
  def product_candidates(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    offset = opts |> Keyword.get(:offset, 0) |> Input.clamp_non_negative(0)
    limit = required_positive_limit(opts)

    eligible_products(now, offset, limit)
  end

  @spec selected_products([term()]) :: [Product.t()]
  def selected_products(selected_slugs) do
    selected_slugs |> normalized_slugs() |> load_selected_products()
  end

  defp eligible_products(now, offset, limit) do
    latest_price =
      PricePoint
      |> where([price], price.merchant_product_id == parent_as(:offer).id)
      |> where([price], price.observed_at <= ^now)
      |> order_by([price], desc: price.observed_at, desc: price.id)
      |> limit(1)
      |> select([price], %{
        observed_at: price.observed_at,
        shipping: price.shipping,
        in_stock: price.in_stock
      })

    eligible_offer =
      MerchantProduct
      |> from(as: :offer)
      |> join(:inner_lateral, [offer: _offer], price in subquery(latest_price), on: true)
      |> where([offer: offer], offer.product_id == parent_as(:product).id)
      |> where(
        [offer, price],
        offer.is_active == true and offer.currency == ^"USD" and price.in_stock == true and
          not is_nil(price.shipping) and
          price.observed_at >= ^DateTime.add(now, -86_400, :second)
      )

    current_specification =
      from current in ProductAttributeCurrent,
        where: current.product_id == parent_as(:product).id

    Product
    |> Filtering.apply_filters(%{})
    |> where([product: _product], exists(current_specification))
    |> where([product: _product], exists(eligible_offer))
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  defp load_selected_products([]), do: []

  defp load_selected_products(slugs) do
    products_by_slug = Catalog.get_products_by_slugs(slugs)

    slugs
    |> Enum.flat_map(fn slug -> List.wrap(Map.get(products_by_slug, slug)) end)
    |> Enum.uniq_by(& &1.id)
  end

  defp normalized_slugs(slugs) when is_list(slugs) do
    slugs
    |> Enum.filter(&(is_binary(&1) and String.trim(&1) != ""))
    |> Enum.uniq()
    |> Enum.take(@max_selection)
  end

  defp normalized_slugs(_), do: []

  defp required_positive_limit(opts) do
    case Keyword.fetch(opts, :limit) do
      {:ok, limit} when is_integer(limit) and limit > 0 ->
        limit

      _missing_or_invalid ->
        raise ArgumentError, "home workspace limit must be a positive integer"
    end
  end
end
