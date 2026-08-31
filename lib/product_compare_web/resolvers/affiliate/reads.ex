defmodule ProductCompareWeb.Resolvers.Affiliate.Reads do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Affiliate
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Pricing.Merchant

  @spec active_coupons(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
          | {:error, String.t() | GraphQLErrors.top_level_error()}
  def active_coupons(_parent, args, resolution) when is_map(args) do
    with {:ok, merchant_id, attrs} <- normalize_active_coupon_request(args, resolution),
         {:ok, connection} <- active_coupon_connection(merchant_id, attrs) do
      {:ok, connection}
    else
      {:error, reason} -> active_coupon_error(reason)
    end
  end

  def active_coupons(_parent, _args, resolution) do
    {:error, reason} = Authorization.require_operator(resolution)
    {:error, GraphQLErrors.authorization_error(reason)}
  end

  @spec merchant_product_active_coupons(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_product_active_coupons(
        %{merchant_id: merchant_id},
        args,
        %{context: %{loader: loader}}
      ) do
    connection_args = Input.connection_args(args)

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      source = Loader.offer_connection_source()
      operation = {:active_coupons, connection_args}
      batch = {:one, Merchant}
      item = [{operation, merchant_id}]

      loader
      |> Dataloader.load(source, batch, item)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, batch, item)}
      end)
    end
  end

  defp active_coupon_connection(merchant_id, args) do
    now =
      case Input.fetch_value(args, :at) do
        %DateTime{} = at -> at
        _ -> DateTime.utc_now()
      end

    merchant_id
    |> Affiliate.list_active_coupons_query(now)
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  defp normalize_active_coupon_request(input, resolution) do
    with {:ok, _operator} <- Authorization.require_operator(resolution),
         {:ok, %{merchant_id: merchant_id} = attrs} <- normalize_merchant_id(input),
         connection_args = Input.connection_args(attrs),
         {:ok, _window} <- Connection.batch_window_result(connection_args) do
      {:ok, merchant_id, attrs}
    end
  end

  defp normalize_merchant_id(attrs) do
    case Input.decode_optional_integer_id_field(attrs, :merchant_id, :merchant, "merchant") do
      {:ok, attrs} -> {:ok, attrs}
      {:error, _message} -> {:error, {:invalid_id, :merchant_id}}
    end
  end

  defp active_coupon_error(reason) when reason in [:unauthenticated, :forbidden],
    do: {:error, GraphQLErrors.authorization_error(reason)}

  defp active_coupon_error({:invalid_id, :merchant_id}), do: {:error, "invalid merchant id"}
  defp active_coupon_error(reason) when is_binary(reason), do: {:error, reason}
  defp active_coupon_error(_reason), do: {:error, "invalid input"}
end
