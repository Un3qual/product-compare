defmodule ProductCompareWeb.Resolvers.PricingResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.SourceArtifact

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchants(_parent, args, _resolution) do
    query = Pricing.list_merchants_query()
    Connection.from_query_result(query, Input.connection_args(args), Repo)
  end

  def merchant(_parent, %{slug: slug}, _resolution), do: {:ok, Pricing.get_merchant_by_slug(slug)}

  def merchant_detail_summary(merchant, _args, %{context: %{loader: loader}}) do
    source = Loader.merchant_detail_source()

    loader
    |> Dataloader.load(source, :summary, merchant)
    |> on_load(fn loader ->
      case Dataloader.get(loader, source, :summary, merchant) do
        %{summary: summary} -> {:ok, summary}
        nil -> {:error, "merchant not found"}
      end
    end)
  end

  def merchant_offers(
        %{id: merchant_id} = merchant,
        args,
        %{context: %{loader: loader}}
      )
      when is_integer(merchant_id) do
    connection_args = Input.connection_args(args)

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      load_offer_connection(loader, {:merchant_offers, connection_args}, merchant)
    end
  end

  def merchant_offers(%{id: merchant_id}, args, _resolution) do
    query = Pricing.list_merchant_offers_query(merchant_id, true)
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
  def product_merchant_products(
        %{id: product_id} = product,
        args,
        %{context: %{loader: loader}}
      )
      when is_integer(product_id) do
    with {:ok, merchant_id} <-
           Input.decode_optional_integer_id(
             Input.fetch_value(args || %{}, :merchant_id),
             :merchant,
             "merchant"
           ),
         connection_args = Input.connection_args(args),
         {:ok, _window} <- Connection.batch_window_result(connection_args) do
      filters = %{
        merchant_id: merchant_id,
        active_only: Input.fetch_value(args || %{}, :active_only, false)
      }

      load_offer_connection(
        loader,
        {:product_offers, connection_args, filters},
        product
      )
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

  @spec source_artifact(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, SourceArtifact.t() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def source_artifact(%{artifact_id: nil}, _args, _resolution), do: {:ok, nil}

  def source_artifact(%{artifact_id: artifact_id}, _args, %{context: %{loader: loader}})
      when is_integer(artifact_id) do
    loader
    |> Dataloader.load(Pricing, {:one, SourceArtifact}, id: artifact_id)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, Pricing, {:one, SourceArtifact}, id: artifact_id)}
    end)
  end

  def source_artifact(_price_point, _args, _resolution), do: {:ok, nil}

  @spec product_offer_truth(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def product_offer_truth(%{id: product_id} = product, _args, %{context: %{loader: loader}})
      when is_integer(product_id) do
    source = Loader.product_evidence_source()

    loader
    |> Dataloader.load(source, :offer_truth, product)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, :offer_truth, product)}
    end)
  end

  def product_offer_truth(_product, _args, _resolution) do
    {:ok, Pricing.current_offer_truth(nil)}
  end

  @spec price_history(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def price_history(
        %{id: merchant_product_id} = merchant_product,
        args,
        %{context: %{loader: loader}}
      )
      when is_integer(merchant_product_id) do
    connection_args = Input.connection_args(args)

    range_filters = %{
      from: Input.fetch_value(args || %{}, :from),
      to: Input.fetch_value(args || %{}, :to)
    }

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      load_offer_connection(
        loader,
        {:price_history, connection_args, range_filters},
        merchant_product
      )
    end
  end

  def price_history(_merchant_product, _args, _resolution),
    do: {:error, "invalid merchant product id"}

  defp load_offer_connection(loader, batch_key, parent) do
    source = Loader.offer_connection_source()

    loader
    |> Dataloader.load(source, batch_key, parent)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch_key, parent)}
    end)
  end

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
