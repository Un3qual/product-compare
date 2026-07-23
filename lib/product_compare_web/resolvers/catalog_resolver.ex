defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.Resolvers.Catalog.CurrentAttributes
  alias ProductCompareWeb.Resolvers.Catalog.Discovery
  alias ProductCompareWeb.Resolvers.Catalog.SavedComparisons
  alias ProductCompareSchemas.Catalog.Product

  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  def product(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def comparison_products(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  def comparison_products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def products(parent, args, %{context: %{loader: _loader}} = resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end

  def products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end

  @spec product_filter_metadata(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_filter_metadata(parent, args, %{context: %{loader: _loader}} = resolution) do
    Discovery.product_filter_metadata(parent, args, resolution)
  end

  def product_filter_metadata(parent, args, resolution),
    do: Discovery.product_filter_metadata(parent, args, resolution)

  @spec current_attributes(Product.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, [map()]} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def current_attributes(product, args, resolution),
    do: CurrentAttributes.current_attributes(product, args, resolution)

  @spec my_saved_comparison_sets(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_saved_comparison_sets(parent, args, resolution),
    do: SavedComparisons.my_saved_comparison_sets(parent, args, resolution)

  @spec create_saved_comparison_set(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_saved_comparison_set(parent, args, resolution),
    do: SavedComparisons.create_saved_comparison_set(parent, args, resolution)

  @spec delete_saved_comparison_set(
          any(),
          %{saved_comparison_set_id: String.t()},
          Absinthe.Resolution.t()
        ) ::
          {:ok, map()}
  def delete_saved_comparison_set(parent, args, resolution),
    do: SavedComparisons.delete_saved_comparison_set(parent, args, resolution)
end
