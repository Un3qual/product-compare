defmodule ProductCompareWeb.Resolvers.IngestionResolver do
  @moduledoc false

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  @spec merchant_feed_candidates(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_feed_candidates(_parent, args, _resolution) do
    Ingestion.list_merchant_feed_candidates_query()
    |> Connection.from_query_result(Input.connection_args(args), Repo)
  end

  @spec review_merchant_feed_candidate(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def review_merchant_feed_candidate(_parent, %{input: input}, _resolution) do
    with {:ok, candidate_id} <- decode_candidate_id(Input.fetch_value(input, :id)),
         attrs <- review_attrs(input),
         {:ok, candidate} <- Ingestion.review_merchant_feed_candidate(candidate_id, attrs) do
      {:ok, %{candidate: candidate, errors: []}}
    else
      {:error, :invalid_id} ->
        {:ok, review_error_payload("INVALID_ID", "invalid candidate id", "id")}

      {:error, :not_found} ->
        {:ok, review_error_payload("NOT_FOUND", "candidate not found")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, %{candidate: nil, errors: GraphQLErrors.changeset_mutation_errors(changeset)}}
    end
  end

  defp decode_candidate_id(value) when is_binary(value) do
    case GlobalId.decode_integer(value, :merchant_feed_candidate) do
      {:ok, candidate_id} -> {:ok, candidate_id}
      :error -> {:error, :invalid_id}
    end
  end

  defp decode_candidate_id(_value), do: {:error, :invalid_id}

  defp review_attrs(input) do
    %{
      review_status: normalize_review_status(Input.fetch_value(input, :status)),
      review_note: Input.fetch_value(input, :note)
    }
  end

  defp normalize_review_status(status) when is_atom(status), do: Atom.to_string(status)
  defp normalize_review_status(status) when is_binary(status), do: String.downcase(status)
  defp normalize_review_status(status), do: status

  defp review_error_payload(code, message, field \\ nil) do
    %{
      candidate: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end
end
