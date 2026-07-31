defmodule ProductCompareWeb.Resolvers.Discussions.Reads do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Discussions
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  def review_summary(%{id: product_id} = product, _args, %{context: %{loader: loader}})
      when is_integer(product_id) do
    source = Loader.product_evidence_source()

    loader
    |> Loader.load(source, :review_summary, product)
    |> on_load(fn loader ->
      {:ok, Loader.get(loader, source, :review_summary, product)}
    end)
  end

  def review_summary(product, _args, _resolution),
    do: {:ok, Discussions.review_summary(product.id)}

  def reviews(product, args, %{context: %{loader: loader}}) do
    public_connection(:reviews, product, args, loader)
  end

  def reviews(product, args, _resolution) do
    product.id
    |> Discussions.public_reviews_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def questions(product, args, %{context: %{loader: loader}}) do
    public_connection(:questions, product, args, loader)
  end

  def questions(product, args, _resolution) do
    product.id
    |> Discussions.public_questions_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def viewer_community_submissions(
        %{id: product_id} = product,
        _args,
        %{context: %{current_user: user, loader: loader}}
      )
      when is_integer(product_id) do
    source = Loader.viewer_submission_source()

    loader
    |> Loader.load(source, user.id, product)
    |> on_load(fn loader ->
      {:ok, Loader.get(loader, source, user.id, product)}
    end)
  end

  def viewer_community_submissions(product, _args, %{context: %{current_user: user}}),
    do: {:ok, Discussions.viewer_community_submissions(user.id, product.id)}

  def viewer_community_submissions(_product, _args, _resolution),
    do: {:ok, %{reviews: [], questions: [], answers: []}}

  def answers(question, args, %{context: %{loader: loader}}) do
    public_connection(:answers, question, args, loader)
  end

  def answers(question, args, _resolution) do
    question.id
    |> Discussions.public_answers_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  def question(_parent, %{id: id}, %{context: %{loader: loader}}) do
    with {:ok, entropy_id} <- GlobalId.decode_uuid(id, :product_question) do
      source = Loader.public_opaque_source()

      loader
      |> Loader.load(source, :product_question, entropy_id)
      |> on_load(fn loader ->
        {:ok, Loader.get(loader, source, :product_question, entropy_id)}
      end)
    else
      :error -> {:error, "invalid product question id"}
    end
  end

  def question(_parent, %{id: id}, _resolution) do
    with {:ok, entropy_id} <- GlobalId.decode_uuid(id, :product_question) do
      {:ok, Discussions.get_public_question(entropy_id)}
    else
      :error -> {:error, "invalid product question id"}
    end
  end

  defp public_connection(kind, %{id: parent_id} = parent, args, loader)
       when kind in [:reviews, :questions, :answers] and is_integer(parent_id) do
    connection_args = Input.connection_args(args)

    case Connection.batch_window(connection_args) do
      {:ok, _window} ->
        source = Loader.community_connection_source()
        batch_key = {kind, connection_args}

        loader
        |> Loader.load(source, batch_key, parent)
        |> on_load(fn loader ->
          {:ok, Loader.get(loader, source, batch_key, parent)}
        end)

      {:error, :invalid_first} ->
        {:error, "invalid first"}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}
    end
  end
end
