defmodule ProductCompareWeb.Schema.Seo.Types do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.Resolvers.SeoResolver

  object :seo_category do
    field :id, non_null(:id) do
      resolve(fn category, _, _ -> GlobalId.encode_required(:taxon, category.id) end)
    end

    field :name, non_null(:string)
    field :slug, non_null(:string)
    field :description, non_null(:string)
    field :qualified_product_count, non_null(:integer)
    field :indexable, non_null(:boolean)
    field :seo, non_null(:seo_metadata), resolve: &SeoResolver.category_metadata/3

    connection field :products,
                 node_type: :product,
                 non_null_connection: true,
                 paginate: :forward do
      resolve(&SeoResolver.category_products/3)
    end
  end
end
