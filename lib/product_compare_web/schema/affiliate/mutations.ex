defmodule ProductCompareWeb.Schema.Affiliate.Mutations do
  use Absinthe.Schema.Notation

  alias ProductCompareWeb.Resolvers.Affiliate.Mutations

  object :affiliate_mutations do
    @desc "Upserts an affiliate network by name."
    field :upsert_affiliate_network, :upsert_affiliate_network_payload do
      arg(:input, non_null(:upsert_affiliate_network_input))
      resolve(&Mutations.upsert_affiliate_network/3)
    end

    @desc "Upserts an affiliate program by affiliate network and merchant."
    field :upsert_affiliate_program, :upsert_affiliate_program_payload do
      arg(:input, non_null(:upsert_affiliate_program_input))
      resolve(&Mutations.upsert_affiliate_program/3)
    end

    @desc "Upserts an affiliate link by merchant product."
    field :upsert_affiliate_link, :upsert_affiliate_link_payload do
      arg(:input, non_null(:upsert_affiliate_link_input))
      resolve(&Mutations.upsert_affiliate_link/3)
    end

    @desc "Creates a coupon for a merchant."
    field :create_coupon, :create_coupon_payload do
      arg(:input, non_null(:create_coupon_input))
      resolve(&Mutations.create_coupon/3)
    end
  end
end
