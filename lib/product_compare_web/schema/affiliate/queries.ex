defmodule ProductCompareWeb.Schema.Affiliate.Queries do
  use Absinthe.Schema.Notation
  use Absinthe.Relay.Schema.Notation, :modern

  alias ProductCompareWeb.Resolvers.Affiliate.Reads

  object :affiliate_queries do
    @desc "Returns active coupons for a merchant at a specific timestamp (or now by default)."
    connection field :active_coupons, node_type: :coupon, paginate: :forward do
      arg(:merchant_id, non_null(:id))
      arg(:at, :datetime)
      resolve(&Reads.active_coupons/3)
    end
  end
end
