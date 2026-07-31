defmodule ProductCompareWeb.Schema.Affiliate.Queries do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.Affiliate.Reads

  object :affiliate_queries do
    @desc "Returns active coupons for a merchant at a specific timestamp (or now by default)."
    field :active_coupons, :active_coupons_payload do
      arg(:input, non_null(:active_coupons_input))
      resolve(&Reads.active_coupons/3)
    end
  end
end
