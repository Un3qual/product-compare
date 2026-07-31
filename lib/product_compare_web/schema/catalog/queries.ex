defmodule ProductCompareWeb.Schema.Catalog.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareWeb.Resolvers.Catalog.Discovery
  alias ProductCompareWeb.Resolvers.Catalog.SavedComparisons
  alias ProductCompareWeb.Resolvers.RecommendationsResolver

  object :catalog_queries do
    @desc "Returns a single product by slug."
    field :product, :product do
      arg(:slug, non_null(:string))
      resolve(&CatalogResolver.product/3)
    end

    @desc "Returns one product or null for each requested comparison slug, in requested order."
    field :comparison_products, non_null(list_of(:product)) do
      arg(:slugs, non_null(list_of(non_null(:string))))
      resolve(&CatalogResolver.comparison_products/3)
    end

    @desc "Returns deterministic source-backed guidance for two or three products."
    field :comparison_recommendation, non_null(:comparison_recommendation) do
      arg(:slugs, non_null(list_of(non_null(:string))))
      arg(:profile, non_null(:recommendation_profile))
      resolve(&RecommendationsResolver.comparison_recommendation/3)
    end

    @desc "Returns products in a deterministic requested order with cursor pagination."
    connection field :products, node_type: :product do
      arg(:filters, :product_filters_input)
      resolve(&CatalogResolver.products/3)
    end

    @desc "Returns display-safe metadata for product filter controls."
    field :product_filter_metadata, non_null(:product_filter_metadata) do
      arg(:filters, :product_filters_input)
      resolve(&Discovery.product_filter_metadata/3)
    end

    @desc "Returns the current authenticated user's saved comparison sets."
    connection field :my_saved_comparison_sets, node_type: :saved_comparison_set do
      resolve(&SavedComparisons.my_saved_comparison_sets/3)
    end
  end
end
