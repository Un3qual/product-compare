defmodule ProductCompareWeb.Schema.Pricing.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.Pricing.Merchants
  alias ProductCompareWeb.Resolvers.Pricing.Offers

  object :pricing_queries do
    @desc "Returns merchants ordered by primary key with cursor pagination."
    connection field :merchants, node_type: :merchant do
      resolve(&Merchants.merchants/3)
    end

    @desc "Returns one merchant by canonical slug."
    field :merchant, :merchant do
      arg(:slug, non_null(:string))
      resolve(&Merchants.merchant/3)
    end

    @desc "Returns merchant products for a product with optional merchant and active filters."
    connection field :merchant_products, node_type: :merchant_product do
      arg(:input, non_null(:merchant_products_input))
      resolve(&Offers.merchant_products/3)
    end
  end
end
