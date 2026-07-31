defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Catalog.CurrentAttributes
  alias ProductCompareWeb.Resolvers.Catalog.Discovery
  alias ProductCompareSchemas.Catalog.Product

  @spec product(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, Product.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.product(parent, args, resolution)
  end

  @spec comparison_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, [Product.t() | nil]}
          | {:error, String.t()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def comparison_products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.comparison_products(parent, args, resolution)
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def products(parent, args, resolution) do
    CurrentAttributes.clear_base_unit_symbol_cache(resolution)
    Discovery.products(parent, args, resolution)
  end
end
