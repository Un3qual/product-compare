defmodule ProductCompareWeb.Resolvers.SeoResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Seo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Taxonomy.Taxon

  def category(_parent, args, %{context: %{graphql_observed_at: now}}) do
    {:ok, Seo.get_category(Input.fetch_value(args, :slug), now: now)}
  end

  @spec category_products(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def category_products(
        %{id: category_id, now: %DateTime{} = now},
        args,
        %{context: %{loader: loader}}
      ) do
    connection_args = Input.connection_args(args)

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      source = Loader.category_source()
      operation = {:products, connection_args, now}
      batch = {:one, Taxon}
      item = [{operation, category_id}]

      loader
      |> Dataloader.load(source, batch, item)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, batch, item)}
      end)
    end
  end

  @spec product_metadata(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_metadata(%{id: product_id}, _args, %{context: %{loader: loader}}) do
    source = Loader.product_evidence_source()
    batch = {:one, Product}
    item = [seo: product_id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      metadata = Dataloader.get(loader, source, batch, item)
      {:ok, serialized_metadata(metadata)}
    end)
  end

  def merchant_metadata(%{id: merchant_id} = merchant, _args, %{context: %{loader: loader}}) do
    source = Loader.merchant_detail_source()
    batch = {:one, Merchant}
    item = [summary: merchant_id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      detail = Dataloader.get(loader, source, batch, item)
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
