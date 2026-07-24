defmodule ProductCompareWeb.Resolvers.AffiliateResolver do
  @moduledoc false

  alias ProductCompareWeb.Resolvers.Affiliate.Mutations
  alias ProductCompareWeb.Resolvers.Affiliate.Reads
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors

  @spec upsert_affiliate_network(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_network(parent, args, resolution),
    do: Mutations.upsert_affiliate_network(parent, args, resolution)

  @spec upsert_affiliate_program(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_program(parent, args, resolution),
    do: Mutations.upsert_affiliate_program(parent, args, resolution)

  @spec upsert_affiliate_link(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def upsert_affiliate_link(parent, args, resolution),
    do: Mutations.upsert_affiliate_link(parent, args, resolution)

  @spec create_coupon(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_coupon(parent, args, resolution),
    do: Mutations.create_coupon(parent, args, resolution)

  @spec active_coupons(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def active_coupons(parent, args, resolution), do: Reads.active_coupons(parent, args, resolution)

  @spec merchant_product_active_coupons(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_product_active_coupons(parent, args, resolution),
    do: Reads.merchant_product_active_coupons(parent, args, resolution)
end
