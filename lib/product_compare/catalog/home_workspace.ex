defmodule ProductCompare.Catalog.HomeWorkspace do
  @moduledoc false

  import Ecto.Query

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
    latest_prices =
      from price in PricePoint,
        distinct: price.merchant_product_id,
        order_by: [asc: price.merchant_product_id, desc: price.observed_at, desc: price.id]

    eligible_product_ids =
      from offer in MerchantProduct,
        join: price in subquery(latest_prices),
        on: price.merchant_product_id == offer.id,
        where:
          offer.is_active == true and offer.currency == ^"USD" and price.in_stock == true and
            not is_nil(price.shipping) and
            price.observed_at >= ^DateTime.add(now, -86_400, :second),
        distinct: true,
        select: %{product_id: offer.product_id}

    display_specification_product_ids =
      from current in ProductAttributeCurrent,
        distinct: true,
        select: %{product_id: current.product_id}

    Product
    |> Filtering.apply_filters(%{})
    |> join(:inner, [product: product], eligible in subquery(eligible_product_ids),
      on: eligible.product_id == product.id
    )
    |> join(:inner, [product: product], current in subquery(display_specification_product_ids),
      on: current.product_id == product.id
    )
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  defp load_selected_products([]), do: []

  defp load_selected_products(slugs) do
    products =
      Product
      |> where([product], product.slug in ^slugs)
      |> Repo.all()
      |> Map.new(&{&1.slug, &1})

    Enum.flat_map(slugs, fn slug -> List.wrap(Map.get(products, slug)) end)
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
