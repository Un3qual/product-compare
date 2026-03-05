defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareSchemas.Catalog.Product

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def products(_parent, args, _resolution) do
    query =
      from p in Product,
        left_join: brand in assoc(p, :brand),
        preload: [brand: brand],
        order_by: [asc: p.id]

    case Connection.from_query(query, args || %{}, Repo) do
      {:ok, connection} ->
        {:ok, connection}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}
    end
  end
end
