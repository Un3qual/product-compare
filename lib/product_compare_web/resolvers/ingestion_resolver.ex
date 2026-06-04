defmodule ProductCompareWeb.Resolvers.IngestionResolver do
  @moduledoc false

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Input

  @spec merchant_feed_candidates(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_feed_candidates(_parent, args, _resolution) do
    Ingestion.list_merchant_feed_candidates_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end
end
