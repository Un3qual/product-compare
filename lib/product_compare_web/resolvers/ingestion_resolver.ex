defmodule ProductCompareWeb.Resolvers.IngestionResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Authorization
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.Loader

  @spec merchant_feed_candidates(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def merchant_feed_candidates(
        _parent,
        args,
        %{
          context: %{loader: %Dataloader{} = loader}
        } = resolution
      ) do
    connection_args = Input.connection_args(args)

    filters = %{
      review_status: normalize_review_status(Input.fetch_value(args, :review_status)),
      sort: Input.fetch_value(args, :sort, :name_asc)
    }

    with {:ok, operator} <- Authorization.require_operator(resolution),
         {:ok, _window} <- Connection.batch_window_result(connection_args) do
      load_operator_connection(
        loader,
        {:operator, :merchant_feed_candidates, operator.id, :operator, filters, connection_args}
      )
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:error, GraphQLErrors.authorization_error(reason)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def merchant_feed_candidates(_parent, args, resolution) do
    with {:ok, _user} <- Authorization.require_operator(resolution) do
      query_opts = [
        review_status: normalize_review_status(Input.fetch_value(args, :review_status)),
        sort: Input.fetch_value(args, :sort, :name_asc)
      ]

      Ingestion.list_merchant_feed_candidates_query(query_opts)
      |> Connection.from_query_result(Input.connection_args(args), Repo)
    else
      {:error, reason} -> {:error, GraphQLErrors.authorization_error(reason)}
    end
  end

  @spec review_merchant_feed_candidate(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def review_merchant_feed_candidate(_parent, %{input: input}, resolution) do
    with {:ok, _user} <- Authorization.require_operator(resolution),
         {:ok, candidate_id} <- decode_candidate_id(Input.fetch_value(input, :id)),
         attrs <- review_attrs(input),
         {:ok, candidate} <- Ingestion.review_merchant_feed_candidate(candidate_id, attrs) do
      {:ok, %{candidate: candidate, errors: []}}
    else
      {:error, reason} when reason in [:unauthenticated, :forbidden] ->
        {:ok, review_error_payload(GraphQLErrors.authorization_mutation_error(reason))}

      {:error, :invalid_id} ->
        {:ok, review_error_payload("INVALID_ID", "invalid candidate id", "id")}

      {:error, :not_found} ->
        {:ok, review_error_payload("NOT_FOUND", "candidate not found")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{candidate: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}
    end
  end

  def review_merchant_feed_candidate(_parent, _args, resolution) do
    {:error, reason} = Authorization.require_operator(resolution)
    {:ok, review_error_payload(GraphQLErrors.authorization_mutation_error(reason))}
  end

  defp decode_candidate_id(value) when is_binary(value) do
    case GlobalId.decode_integer(value, :merchant_feed_candidate) do
      {:ok, candidate_id} -> {:ok, candidate_id}
      :error -> {:error, :invalid_id}
    end
  end

  defp decode_candidate_id(_value), do: {:error, :invalid_id}

  defp review_attrs(input) do
    input
    |> Input.take([:note])
    |> Map.new(fn {:note, note} -> {:review_note, note} end)
    |> Map.put(:review_status, normalize_review_status(Input.fetch_value(input, :status)))
  end

  defp normalize_review_status(status) when is_atom(status), do: Atom.to_string(status)
  defp normalize_review_status(status) when is_binary(status), do: String.downcase(status)
  defp normalize_review_status(status), do: status

  defp load_operator_connection(loader, batch_key) do
    source = Loader.authorized_connection_source()

    loader
    |> Dataloader.load(source, batch_key, :connection)
    |> on_load(fn loader ->
      {:ok, Dataloader.get(loader, source, batch_key, :connection)}
    end)
  end

  defp review_error_payload(code, message, field \\ nil) do
    review_error_payload(GraphQLErrors.mutation_error(code, message, field))
  end

  defp review_error_payload(error) when is_map(error) do
    %{
      candidate: nil,
      errors: [error]
    }
  end
end
