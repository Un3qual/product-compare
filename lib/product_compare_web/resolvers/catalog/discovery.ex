defmodule ProductCompareWeb.Resolvers.Catalog.Discovery do
  @moduledoc false

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.Resolvers.Catalog.InputNormalization
  alias ProductCompareSchemas.Catalog.Product

  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil}
  def product(_parent, args, _resolution) do
    {:ok, Catalog.get_product_by_slug(Input.fetch_value(args || %{}, :slug))}
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
  def comparison_products(_parent, args, _resolution) do
    with {:ok, slugs} <-
           InputNormalization.comparison_slugs(Input.fetch_list_value(args || %{}, :slugs)) do
      {:ok, Catalog.list_products_by_slugs(slugs)}
    end
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def products(_parent, args, _resolution) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})) do
      query = Filtering.apply_filters(Product, filters)

      connection_args = Input.connection_args(args)

      Connection.from_query_result(query, connection_args, Repo)
    end
  end

  @spec product_filter_metadata(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def product_filter_metadata(_parent, args, _resolution) do
    with {:ok, filters} <-
           InputNormalization.filters(Input.fetch_value(args || %{}, :filters, %{})) do
      {:ok, Catalog.product_filter_metadata(filters)}
    end
  end
end
