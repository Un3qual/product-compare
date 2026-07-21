defmodule ProductCompareWeb.Resolvers.NodeResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Accounts
  alias ProductCompare.Affiliate
  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.{Brand, Product}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Specs.SourceArtifact

  @public_types [
    :product,
    :brand,
    :merchant,
    :merchant_product,
    :price_point,
    :source_artifact
  ]
  @operator_types [:affiliate_network, :affiliate_program, :affiliate_link, :coupon]
  @owner_scoped_types [:saved_comparison_set, :api_token]

  @spec node(any(), %{id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def node(_parent, %{id: id}, resolution) do
    case decode_node_id(id) do
      {:ok, {type, local_id}} -> fetch_node(type, local_id, resolution)
      error -> node_result(error)
    end
  end

  defp decode_node_id(id) do
    GlobalId.decode_typed_local_id(
      id,
      @public_types ++ @operator_types,
      @owner_scoped_types
    )
  end

  defp fetch_node(type, local_id, %{context: %{loader: loader}}) when type in @public_types do
    {source, schema} = public_batch(type)
    batch = {:one, schema}
    item = [id: local_id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch, item)}
    end)
  end

  defp fetch_node(type, local_id, _resolution) when type in @public_types do
    type
    |> fetch_public_node(local_id)
    |> node_result()
  end

  defp fetch_node(type, local_id, resolution) when type in @operator_types do
    type
    |> fetch_operator_node(local_id, resolution)
    |> node_result()
  end

  defp fetch_node(type, local_id, resolution) when type in @owner_scoped_types do
    type
    |> fetch_owner_scoped_node(local_id, resolution)
    |> node_result()
  end

  defp public_batch(:product), do: {Catalog, Product}
  defp public_batch(:brand), do: {Catalog, Brand}
  defp public_batch(:merchant), do: {Pricing, Merchant}
  defp public_batch(:merchant_product), do: {Pricing, MerchantProduct}
  defp public_batch(:price_point), do: {Pricing, PricePoint}
  defp public_batch(:source_artifact), do: {Pricing, SourceArtifact}

  defp fetch_public_node(:product, id), do: fetch_record(Catalog.get_product(id))
  defp fetch_public_node(:brand, id), do: fetch_record(Catalog.get_brand(id))
  defp fetch_public_node(:merchant, id), do: fetch_record(Pricing.get_merchant(id))

  defp fetch_public_node(:merchant_product, id),
    do: fetch_record(Pricing.get_merchant_product(id))

  defp fetch_public_node(:price_point, id), do: fetch_record(Pricing.get_price_point(id))
  defp fetch_public_node(:source_artifact, id), do: fetch_record(Specs.get_source_artifact(id))

  defp fetch_operator_node(type, id, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution) do
      fetch_record(fetch_affiliate_node(type, id))
    end
  end

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

  defp node_result({:ok, record}), do: {:ok, record}
  defp node_result(:not_found), do: {:ok, nil}

  defp node_result({:error, reason}) when reason in [:invalid_id, :unsupported_type],
    do: {:error, "invalid node id"}

  defp node_result({:error, reason}) when reason in [:unauthenticated, :forbidden],
    do: {:error, GraphQLErrors.authorization_error(reason)}

  defp fetch_record(nil), do: :not_found
  defp fetch_record(record), do: {:ok, record}
end
