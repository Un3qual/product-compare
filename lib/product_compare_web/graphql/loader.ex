defmodule ProductCompareWeb.GraphQL.Loader do
  @moduledoc """
  Builds the request-scoped GraphQL dataloader sources.
  """

  alias ProductCompare.Catalog
  alias ProductCompare.Pricing
  alias ProductCompare.Repo

  @spec new(map()) :: Dataloader.t()
  def new(params \\ %{}) do
    Dataloader.new()
    |> Dataloader.add_source(Catalog, catalog_source(params))
    |> Dataloader.add_source(Pricing, pricing_source(params))
  end

  defp catalog_source(params) do
    Dataloader.Ecto.new(Repo, query: &catalog_query/2, default_params: params)
  end

  defp pricing_source(params) do
    Dataloader.Ecto.new(Repo, query: &pricing_query/2, default_params: params)
  end

  defp catalog_query(queryable, _params), do: queryable
  defp pricing_query(queryable, _params), do: queryable
end
