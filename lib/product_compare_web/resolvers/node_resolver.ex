defmodule ProductCompareWeb.Resolvers.NodeResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Accounts.{ApiToken, User}

  alias ProductCompareSchemas.Affiliate.{
    AffiliateLink,
    AffiliateNetwork,
    AffiliateProgram,
    Coupon
  }

  alias ProductCompareSchemas.Alerts.{AlertEvent, PriceWatchRule}
  alias ProductCompareSchemas.Catalog.{Brand, ComparisonSnapshot, Product, SavedComparisonSet}
  alias ProductCompareSchemas.Discussions.{ProductReview, ProductThread, ThreadPost}
  alias ProductCompareSchemas.Ingestion.{CJProgram, MerchantFeedCandidate}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Specs.{SourceArtifact, SpecificationCorrection}

  @public_integer_types [
    :product,
    :brand,
    :merchant,
    :merchant_product,
    :price_point,
    :source_artifact
  ]
  @community_uuid_types [:product_review, :product_question, :product_answer]
  @operator_integer_types [
    :affiliate_network,
    :affiliate_program,
    :affiliate_link,
    :coupon,
    :merchant_feed_candidate
  ]
  @operator_uuid_types [:cj_program]
  @owner_uuid_types [
    :saved_comparison_set,
    :api_token,
    :comparison_snapshot,
    :price_watch,
    :alert_event
  ]
  @owner_integer_types [:specification_correction]
  @self_uuid_types [:user]
  @max_bigint_id 9_223_372_036_854_775_807

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

  @spec relay_node(%{type: atom(), id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, term() | nil}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def relay_node(%{type: type, id: id}, resolution) do
    case parse_local_node_id(type, id) do
      {:ok, local_id} -> fetch_node(type, local_id, resolution)
      error -> node_result(error)
    end
  end

  defp parse_local_node_id(type, id)
       when type in @public_integer_types or type in @operator_integer_types or
              type in @owner_integer_types do
    case Integer.parse(id) do
      {parsed_id, ""} when parsed_id > 0 and parsed_id <= @max_bigint_id -> {:ok, parsed_id}
      _ -> {:error, :invalid_id}
    end
  end

  defp parse_local_node_id(type, id)
       when type in @community_uuid_types or type in @operator_uuid_types or
              type in @owner_uuid_types or type in @self_uuid_types do
    case Ecto.UUID.cast(id) do
      {:ok, parsed_id} -> {:ok, parsed_id}
      :error -> {:error, :invalid_id}
    end
  end

  defp parse_local_node_id(_type, _id), do: {:error, :unsupported_type}

  defp decode_node_id(id) do
    GlobalId.decode_typed_local_id(
      id,
      @public_integer_types ++ @operator_integer_types ++ @owner_integer_types,
      @community_uuid_types ++ @operator_uuid_types ++ @owner_uuid_types ++ @self_uuid_types
    )
  end

  defp fetch_node(type, local_id, %{context: %{loader: loader}})
       when type in @public_integer_types do
    {source, schema} = public_batch(type)
    batch = {:one, schema}
    item = [id: local_id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch, item)}
    end)
  end

  defp fetch_node(type, local_id, _resolution) when type in @public_integer_types do
    type
    |> fetch_public_node(local_id)
    |> node_result()
  end

  defp fetch_node(type, local_id, resolution)
       when type in @community_uuid_types do
    viewer_id = current_user_id(resolution)

    fetch_authorized_node(
      {:viewer, type, viewer_id},
      local_id,
      resolution
    )
  end

  defp fetch_node(type, local_id, resolution)
       when type in @operator_integer_types or type in @operator_uuid_types do
    fetch_operator_node(type, local_id, resolution)
  end

  defp fetch_node(:specification_correction, local_id, resolution) do
    case Authorization.require_operator(resolution) do
      {:ok, %User{id: operator_id}} ->
        fetch_authorized_node(
          {:operator, :specification_correction, operator_id},
          local_id,
          resolution
        )

      {:error, :forbidden} ->
        fetch_owner_scoped_node(:specification_correction, local_id, resolution)

      {:error, :unauthenticated} ->
        node_result(:not_found)
    end
  end

  defp fetch_node(type, local_id, resolution) when type in @owner_uuid_types do
    fetch_owner_scoped_node(type, local_id, resolution)
  end

  defp fetch_node(
         :user,
         entropy_id,
         %{
           context: %{current_user: %User{id: user_id}}
         } = resolution
       ) do
    fetch_authorized_node({:self, :user, user_id}, entropy_id, resolution)
  end

  defp fetch_node(:user, _entropy_id, _resolution), do: node_result(:not_found)

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
    with {:ok, %User{id: operator_id}} <- Authorization.require_operator(resolution) do
      fetch_authorized_node(
        {:operator, type, operator_id},
        id,
        resolution
      )
    else
      error -> node_result(error)
    end
  end

  defp fetch_owner_scoped_node(
         type,
         local_id,
         %{
           context: %{current_user: %User{id: user_id}}
         } = resolution
       )
       when type in @owner_uuid_types or type in @owner_integer_types do
    fetch_authorized_node(
      {:owner, type, user_id},
      local_id,
      resolution
    )
  end

  defp fetch_owner_scoped_node(type, _local_id, _resolution)
       when type in @owner_uuid_types or type in @owner_integer_types,
       do: node_result(:not_found)

  defp fetch_authorized_node(batch, item, %{context: %{loader: loader}}) do
    source = Loader.authorized_node_source()
    {schema, operation} = authorized_batch(batch)
    dataloader_batch = {:one, schema}
    dataloader_item = [{operation, item}]

    loader
    |> Dataloader.load(source, dataloader_batch, dataloader_item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, dataloader_batch, dataloader_item)}
    end)
  end

  defp authorized_batch({:viewer, type, viewer_id}),
    do: {authorized_schema(type), {:visible_to, viewer_id}}

  defp authorized_batch({:operator, type, operator_id}),
    do: {authorized_schema(type), {:operator, operator_id}}

  defp authorized_batch({:owner, type, user_id}),
    do: {authorized_schema(type), {:owner, user_id}}

  defp authorized_batch({:self, :user, user_id}), do: {User, {:self, user_id}}

  defp authorized_schema(:product_review), do: ProductReview
  defp authorized_schema(:product_question), do: ProductThread
  defp authorized_schema(:product_answer), do: ThreadPost
  defp authorized_schema(:affiliate_network), do: AffiliateNetwork
  defp authorized_schema(:affiliate_program), do: AffiliateProgram
  defp authorized_schema(:affiliate_link), do: AffiliateLink
  defp authorized_schema(:coupon), do: Coupon
  defp authorized_schema(:cj_program), do: CJProgram
  defp authorized_schema(:merchant_feed_candidate), do: MerchantFeedCandidate
  defp authorized_schema(:saved_comparison_set), do: SavedComparisonSet
  defp authorized_schema(:api_token), do: ApiToken
  defp authorized_schema(:comparison_snapshot), do: ComparisonSnapshot
  defp authorized_schema(:price_watch), do: PriceWatchRule
  defp authorized_schema(:alert_event), do: AlertEvent
  defp authorized_schema(:specification_correction), do: SpecificationCorrection

  defp current_user_id(%{context: %{current_user: %User{id: user_id}}}), do: user_id
  defp current_user_id(_resolution), do: nil

  defp node_result({:ok, record}), do: {:ok, record}
  defp node_result(:not_found), do: {:ok, nil}

  defp node_result({:error, reason}) when reason in [:invalid_id, :unsupported_type],
    do: {:error, "invalid node id"}

  defp node_result({:error, reason}) when reason in [:unauthenticated, :forbidden],
    do: {:error, GraphQLErrors.authorization_error(reason)}

  defp fetch_record(nil), do: :not_found
  defp fetch_record(record), do: {:ok, record}
end
