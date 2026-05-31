defmodule ProductCompareWeb.Resolvers.NodeResolver do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompare.Affiliate
  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Accounts.User

  @public_types [:product, :brand, :merchant, :merchant_product, :price_point]
  @authenticated_types [:affiliate_network, :affiliate_program, :affiliate_link, :coupon]
  @owner_scoped_types [:saved_comparison_set, :api_token]

  @spec node(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil} | {:error, String.t()}
  def node(_parent, %{id: id}, resolution) do
    with {:ok, {type, local_id}} <- decode_node_id(id),
         {:ok, record} <- fetch_node(type, local_id, resolution) do
      {:ok, record}
    else
      :not_found -> {:ok, nil}
      {:error, :invalid_id} -> {:error, "invalid node id"}
      {:error, :unsupported_type} -> {:error, "invalid node id"}
    end
  end

  defp decode_node_id(id) do
    GlobalId.decode_typed_local_id(
      id,
      @public_types ++ @authenticated_types,
      @owner_scoped_types
    )
  end

  defp fetch_node(type, local_id, _resolution) when type in @public_types do
    fetch_public_node(type, local_id)
  end

  defp fetch_node(type, local_id, resolution) when type in @authenticated_types do
    fetch_authenticated_node(type, local_id, resolution)
  end

  defp fetch_node(type, local_id, resolution) when type in @owner_scoped_types do
    fetch_owner_scoped_node(type, local_id, resolution)
  end

  defp fetch_public_node(:product, id), do: fetch_record(Catalog.get_product(id))
  defp fetch_public_node(:brand, id), do: fetch_record(Catalog.get_brand(id))
  defp fetch_public_node(:merchant, id), do: fetch_record(Pricing.get_merchant(id))

  defp fetch_public_node(:merchant_product, id),
    do: fetch_record(Pricing.get_merchant_product(id))

  defp fetch_public_node(:price_point, id), do: fetch_record(Pricing.get_price_point(id))

  defp fetch_authenticated_node(type, id, %{context: %{current_user: %User{}}}) do
    fetch_record(fetch_affiliate_node(type, id))
  end

  defp fetch_authenticated_node(_type, _id, _resolution), do: fetch_record(nil)

  defp fetch_affiliate_node(:affiliate_network, id), do: Affiliate.get_affiliate_network(id)
  defp fetch_affiliate_node(:affiliate_program, id), do: Affiliate.get_affiliate_program(id)
  defp fetch_affiliate_node(:affiliate_link, id), do: Affiliate.get_affiliate_link(id)
  defp fetch_affiliate_node(:coupon, id), do: Affiliate.get_coupon(id)

  defp fetch_owner_scoped_node(
         :saved_comparison_set,
         entropy_id,
         %{context: %{current_user: %User{} = user}}
       ) do
    fetch_record(Catalog.get_saved_comparison_set_for_user(user, entropy_id))
  end

  defp fetch_owner_scoped_node(:saved_comparison_set, _entropy_id, _resolution),
    do: fetch_record(nil)

  defp fetch_owner_scoped_node(:api_token, token_entropy_id, %{
         context: %{current_user: %User{} = user}
       }) do
    fetch_record(Accounts.get_api_token_for_user(user, token_entropy_id))
  end

  defp fetch_owner_scoped_node(:api_token, _token_entropy_id, _resolution),
    do: fetch_record(nil)

  defp fetch_record(nil), do: :not_found
  defp fetch_record(record), do: {:ok, record}
end
