defmodule ProductCompareWeb.Schema.Seo.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.SeoResolver

  object :seo_queries do
    @desc "Returns a curated public product category by canonical search slug."
    field :category, :seo_category do
      arg(:slug, non_null(:string))
      resolve(&SeoResolver.category/3)
    end
  end
end
