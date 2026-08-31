defmodule ProductCompareWeb.Resolvers.Discussions.Reads do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Discussions
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.ProductThread

  @spec review_summary(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map() | nil} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def review_summary(%{id: product_id}, _args, %{context: %{loader: loader}}) do
    source = Loader.product_evidence_source()
    batch = {:one, Product}
    item = [review_summary: product_id]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch, item)}
    end)
  end

  def reviews(%{id: product_id}, args, %{context: %{loader: loader}}) do
    public_connection(Product, :reviews, product_id, args, loader)
  end

  def questions(%{id: product_id}, args, %{context: %{loader: loader}}) do
    public_connection(Product, :questions, product_id, args, loader)
  end

  def viewer_community_submissions(
        %{id: product_id},
        _args,
        %{context: %{current_user: user, loader: loader}}
      )
      when is_integer(product_id) do
    source = Loader.viewer_submission_source()
    batch = {:one, Product}
    operation = {:viewer_submissions, user.id}
    item = [{operation, product_id}]

    loader
    |> Dataloader.load(source, batch, item)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch, item)}
    end)
  end

  def viewer_community_submissions(_product, _args, _resolution),
    do: {:ok, %{reviews: [], questions: [], answers: []}}

  def answers(%{id: question_id}, args, %{context: %{loader: loader}}) do
    public_connection(ProductThread, :answers, question_id, args, loader)
  end

  def question(_parent, %{id: id}, _resolution) do
    with {:ok, entropy_id} <- GlobalId.decode_uuid(id, :product_question) do
      {:ok, Discussions.get_public_question(entropy_id)}
    else
      :error -> {:error, "invalid product question id"}
    end
  end

  defp public_connection(schema, kind, parent_id, args, loader)
       when kind in [:reviews, :questions, :answers] and is_integer(parent_id) do
    connection_args = Input.connection_args(args)

    case Connection.batch_window(connection_args) do
      {:ok, _window} ->
        source = Loader.community_connection_source()
        operation = {kind, connection_args}
        batch = {:one, schema}
        item = [{operation, parent_id}]

        loader
        |> Dataloader.load(source, batch, item)
        |> on_load(fn loader ->
          {:ok, Dataloader.get(loader, source, batch, item)}
        end)

      {:error, :invalid_first} ->
        {:error, "invalid first"}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}
    end
  end
end
