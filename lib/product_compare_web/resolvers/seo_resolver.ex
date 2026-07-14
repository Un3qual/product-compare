defmodule ProductCompareWeb.Resolvers.SeoResolver do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input

  def category(_parent, args, _resolution) do
    {:ok, Seo.get_category(Input.fetch_value(args, :slug))}
  end

  def category_products(category, args, _resolution) do
    category.id
    |> Seo.qualified_products_for_taxon_query(category.now)
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def product_metadata(product, _args, _resolution),
    do: {:ok, serialized_metadata(Seo.product_metadata(product))}

  def merchant_metadata(merchant, _args, _resolution),
    do: {:ok, serialized_metadata(Seo.merchant_metadata(merchant))}

  def category_metadata(category, _args, _resolution),
    do: {:ok, serialized_metadata(Seo.category_metadata(category))}

  def snapshot_metadata(snapshot, _args, _resolution),
    do: {:ok, serialized_metadata(Seo.snapshot_metadata(snapshot))}

  defp serialized_metadata(metadata) do
    Map.update(metadata, :structured_data, nil, fn
      nil -> nil
      structured_data -> structured_data |> Jason.encode!() |> String.replace("<", "\\u003c")
    end)
  end
end
