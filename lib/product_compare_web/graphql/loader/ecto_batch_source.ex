defmodule ProductCompareWeb.GraphQL.Loader.EctoBatchSource do
  @moduledoc """
  Adapts request-scoped, set-based reads to Dataloader's Ecto source.

  Dataloader.Ecto requires a schema-shaped batch key. The private marker schema
  gives non-association batches that key while the documented `run_batch`
  callback keeps each context's set-based query implementation intact.
  """

  import Ecto.Query

  alias ProductCompare.Repo

  defmodule Item do
    @moduledoc false

    use Ecto.Schema

    @primary_key {:key, :binary, autogenerate: false}
    schema "__graphql_dataloader_batch_items__" do
    end
  end

  @type handler :: (term(), MapSet.t() -> map())

  @spec new(handler()) :: Dataloader.Ecto.t()
  def new(handler) when is_function(handler, 2) do
    Dataloader.Ecto.new(Repo,
      query: &query/2,
      run_batch: &run_batch(handler, &1, &2, &3, &4, &5)
    )
  end

  @spec load(Dataloader.t(), Dataloader.source_name(), term(), term()) :: Dataloader.t()
  def load(loader, source, operation, item) do
    Dataloader.load(loader, source, batch(operation), encode(item))
  end

  @spec get(Dataloader.t(), Dataloader.source_name(), term(), term()) :: term()
  def get(loader, source, operation, item) do
    case Dataloader.get(loader, source, batch(operation), encode(item)) do
      {:ok, value} -> value
      {:error, reason} -> raise Dataloader.GetError, inspect(reason)
      value -> value
    end
  end

  defp batch(operation), do: {:one, Item, operation: encode(operation)}

  defp query(Item, params) do
    Item
    |> from()
    |> Ecto.Query.put_query_prefix(Map.fetch!(params, :operation))
  end

  defp run_batch(handler, Item, query, :key, encoded_items, _repo_opts) do
    operation = decode(query.prefix)
    items = Enum.map(encoded_items, &decode/1)
    results = handler.(operation, MapSet.new(items))

    Enum.map(items, &[Map.get(results, &1)])
  end

  defp run_batch(_handler, queryable, query, column, inputs, repo_opts) do
    Dataloader.Ecto.run_batch(Repo, queryable, query, column, inputs, repo_opts)
  end

  defp encode(term), do: term |> :erlang.term_to_binary() |> Base.url_encode64(padding: false)

  defp decode(encoded) do
    encoded
    |> Base.url_decode64!(padding: false)
    |> :erlang.binary_to_term([:safe])
  end
end
