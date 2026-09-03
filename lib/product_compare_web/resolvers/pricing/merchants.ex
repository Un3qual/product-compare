defmodule ProductCompareWeb.Resolvers.Pricing.Merchants do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Pricing.Merchant

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchants(_parent, args, _resolution) do
    query = Pricing.list_merchants_query()
    Connection.from_query_result(query, Input.connection_args(args), Repo)
  end

  @spec merchant(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Pricing.Merchant.t() | nil}
  def merchant(_parent, %{slug: slug}, _resolution), do: {:ok, Pricing.get_merchant_by_slug(slug)}

  @spec merchant_detail_summary(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchant_detail_summary(merchant, _args, %{context: %{loader: loader}}) do
    source = Loader.merchant_detail_source()
    batch = {:one, Merchant}
    item = [summary: merchant.id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      case Dataloader.get(loader, source, batch, item) do
        %{summary: summary} -> {:ok, summary}
        nil -> {:error, "merchant not found"}
      end
    end)
  end

  @spec merchant_offers(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def merchant_offers(
        %{id: merchant_id},
        args,
        %{context: %{loader: loader}}
      ) do
    connection_args = Input.connection_args(args)

    with {:ok, _window} <- Connection.batch_window_result(connection_args) do
      load_offer_connection(loader, {:merchant_offers, connection_args}, merchant_id)
    end
  end

  defp load_offer_connection(loader, operation, merchant_id) do
    source = Loader.offer_connection_source()
    batch = {:one, Merchant}
    item = [{operation, merchant_id}]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch, item)}
    end)
  end
end
