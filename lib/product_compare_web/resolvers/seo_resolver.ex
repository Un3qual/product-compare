defmodule ProductCompareWeb.Resolvers.SeoResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  def category(_parent, args, _resolution) do
    {:ok, Seo.get_category(Input.fetch_value(args, :slug))}
  end

  def category_products(category, args, _resolution) do
    category.id
    |> Seo.qualified_products_for_taxon_query(category.now)
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def product_metadata(%{id: product_id} = product, _args, %{context: %{loader: loader}})
      when is_integer(product_id) do
    source = Loader.product_evidence_source()

    loader
    |> Dataloader.load(source, :seo, product)
    |> on_load(fn loader ->
      metadata = Dataloader.get(loader, source, :seo, product)
      {:ok, serialized_metadata(metadata)}
    end)
  end

  def product_metadata(product, _args, _resolution),
    do: {:ok, serialized_metadata(Seo.product_metadata(product))}

  def merchant_metadata(merchant, _args, %{context: %{loader: loader}}) do
    source = Loader.merchant_detail_source()

    loader
    |> Dataloader.load(source, :summary, merchant)
    |> on_load(fn loader ->
      detail = Dataloader.get(loader, source, :summary, merchant)
      {:ok, serialized_metadata(Seo.merchant_metadata(merchant, detail: detail))}
    end)
  end

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
