defmodule ProductCompareWeb.Resolvers.Catalog.Discovery do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareWeb.Resolvers.Catalog.InputNormalization
  alias ProductCompareSchemas.Catalog.Product

  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product(_parent, args, %{context: %{loader: loader}}) do
    slug = Input.fetch_value(args || %{}, :slug)
    source = Loader.public_slug_source()

    loader
    |> Dataloader.load(source, :product, slug)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, :product, slug)}
    end)
  end

  def product(_parent, args, _resolution) do
    {:ok, Catalog.get_product_by_slug(Input.fetch_value(args || %{}, :slug))}
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def comparison_products(_parent, args, %{context: %{loader: loader}}) do
    with {:ok, slugs} <-
           InputNormalization.comparison_slugs(Input.fetch_list_value(args || %{}, :slugs)) do
      source = Loader.comparison_source()

      loader
      |> Dataloader.load(source, :products, slugs)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, :products, slugs)}
      end)
    end
  end

  def comparison_products(_parent, args, _resolution) do
    with {:ok, slugs} <-
           InputNormalization.comparison_slugs(Input.fetch_list_value(args || %{}, :slugs)) do
      {:ok, Catalog.list_products_by_slugs(slugs)}
    end
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def products(_parent, args, %{context: %{loader: loader}}) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})),
         connection_args = Input.connection_args(args),
         {:ok, _window} <- Connection.batch_window_result(connection_args) do
      source = Loader.discovery_root_source()
      batch_key = {:products, filters, connection_args}

      loader
      |> Dataloader.load(source, batch_key, :root)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, batch_key, :root)}
      end)
    end
  end

  def products(_parent, args, _resolution) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})) do
      query = Filtering.apply_filters(Product, filters)

      connection_args = Input.connection_args(args)

      Connection.from_query_result(query, connection_args, Repo)
    end
  end

  @spec product_filter_metadata(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_filter_metadata(_parent, args, %{context: %{loader: loader}}) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})) do
      source = Loader.discovery_root_source()
      batch_key = {:product_filter_metadata, filters}

      loader
      |> Dataloader.load(source, batch_key, :root)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, batch_key, :root)}
      end)
    end
  end

  def product_filter_metadata(_parent, args, _resolution) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})) do
      {:ok, Catalog.product_filter_metadata(filters)}
    end
  end
end
