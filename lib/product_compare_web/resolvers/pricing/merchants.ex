defmodule ProductCompareWeb.Resolvers.Pricing.Merchants do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchants(_parent, args, %{context: %{loader: loader}}) do
    connection_args = Input.connection_args(args)

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      source = Loader.discovery_root_source()
      batch_key = {:merchants, connection_args}

      loader
      |> Dataloader.load(source, batch_key, :root)
      |> on_load(fn loader ->
        {:ok, Dataloader.get(loader, source, batch_key, :root)}
      end)
    end
  end

  def merchants(_parent, args, _resolution) do
    query = Pricing.list_merchants_query()
    Connection.from_query_result(query, Input.connection_args(args), Repo)
  end

  @spec merchant(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Pricing.Merchant.t() | nil}
          | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchant(_parent, %{slug: slug}, %{context: %{loader: loader}}) do
    source = Loader.public_slug_source()

    loader
    |> Dataloader.load(source, :merchant, slug)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, :merchant, slug)}
    end)
  end

  def merchant(_parent, %{slug: slug}, _resolution), do: {:ok, Pricing.get_merchant_by_slug(slug)}

  @spec merchant_detail_summary(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
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

  @spec merchant_offers(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
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

  defp load_offer_connection(loader, batch_key, parent) do
    source = Loader.offer_connection_source()

    loader
    |> Dataloader.load(source, batch_key, parent)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch_key, parent)}
    end)
  end
end
