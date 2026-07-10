defmodule ProductCompareWeb.Resolvers.PricingResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareSchemas.Pricing.PricePoint

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchants(_parent, args, _resolution) do
    query = Pricing.list_merchants_query()
    Connection.from_query_result(query, Input.connection_args(args), Repo)
  end

  @spec merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_products(_parent, %{input: input}, _resolution) do
    with {:ok, attrs} <- normalize_merchant_products_input(input) do
      query = Pricing.list_merchant_products_query(attrs)
      Connection.from_query_result(query, Input.connection_args(attrs), Repo)
    end
  end

  @spec product_merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def product_merchant_products(%{id: product_id}, args, _resolution)
      when is_integer(product_id) do
    with {:ok, merchant_id} <-
           Input.decode_optional_integer_id(
             Input.fetch_value(args || %{}, :merchant_id),
             :merchant,
             "merchant"
           ) do
      attrs = %{
        product_id: product_id,
        merchant_id: merchant_id,
        active_only: Input.fetch_value(args || %{}, :active_only, false),
        first: Input.fetch_value(args || %{}, :first),
        after: Input.fetch_value(args || %{}, :after)
      }

      query = Pricing.list_merchant_products_query(attrs)
      Connection.from_query_result(query, Input.connection_args(attrs), Repo)
    end
  end

  def product_merchant_products(_product, _args, _resolution),
    do: {:error, "invalid product id"}

  @spec latest_price(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Pricing.PricePoint.t() | nil}
  def latest_price(%{id: merchant_product_id}, _args, %{context: %{loader: loader}})
      when is_integer(merchant_product_id) do
    loader
    |> Dataloader.load(Pricing, {:one, PricePoint}, latest_price: merchant_product_id)
    |> on_load(fn loader ->
      {:ok,
       Dataloader.get(loader, Pricing, {:one, PricePoint}, latest_price: merchant_product_id)}
    end)
  end

  def latest_price(_merchant_product, _args, _resolution), do: {:ok, nil}

  @spec price_history(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def price_history(%{id: merchant_product_id}, args, _resolution)
      when is_integer(merchant_product_id) do
    query =
      Pricing.price_history_query(merchant_product_id, %{
        from: Input.fetch_value(args || %{}, :from),
        to: Input.fetch_value(args || %{}, :to),
        order: :desc
      })

    Connection.from_query_result(query, Input.connection_args(args), Repo)
  end

  def price_history(_merchant_product, _args, _resolution),
    do: {:error, "invalid merchant product id"}

  defp normalize_merchant_products_input(input) when is_map(input) do
    with {:ok, product_id} <-
           Input.decode_required_integer_id(
             Input.fetch_value(input, :product_id),
             :product,
             "product"
           ),
         {:ok, merchant_id} <-
           Input.decode_optional_integer_id(
             Input.fetch_value(input, :merchant_id),
             :merchant,
             "merchant"
           ) do
      {:ok,
       %{
         product_id: product_id,
         merchant_id: merchant_id,
         active_only: Input.fetch_value(input, :active_only, false),
         first: Input.fetch_value(input, :first),
         after: Input.fetch_value(input, :after)
       }}
    end
  end

  defp normalize_merchant_products_input(_input), do: {:error, "invalid product id"}
end
