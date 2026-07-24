defmodule ProductCompareWeb.Resolvers.Auth.ApiTokens do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.AuthorizedConnection
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input

  @spec my_api_tokens(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_api_tokens(_parent, args, %{
        context: %{current_user: current_user, loader: %Dataloader{} = loader}
      }) do
    args = args || %{}
    status_filter = Input.fetch_value(args, :status, :all)
    connection_args = args |> Input.drop_key(:status) |> Input.connection_args()
    filters = %{status: status_filter}

    AuthorizedConnection.load_owner(
      loader,
      current_user,
      :api_tokens,
      filters,
      connection_args
    )
  end

  def my_api_tokens(_parent, args, %{context: %{current_user: current_user}}) do
    args = args || %{}
    status_filter = Input.fetch_value(args, :status, :all)
    query = Accounts.list_api_tokens_query(current_user.id, status: status_filter)
    connection_args = args |> Input.drop_key(:status) |> Input.connection_args()

    Connection.from_query_result(query, connection_args, Repo)
  end

  def my_api_tokens(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec create_api_token(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def create_api_token(_parent, args, %{context: %{current_user: current_user}}) do
    attrs = Input.take(args, [:label, :expires_at])

    case Accounts.create_api_token(current_user.id, attrs) do
      {:ok, result} ->
        {:ok, Map.put(result, :errors, [])}

      {:error, changeset} ->
        {:ok,
         create_rotate_error_payload(
           "INVALID_ARGUMENT",
           GraphQLErrors.changeset_first_message(changeset)
         )}
    end
  end

  def create_api_token(_parent, _args, _resolution),
    do: {:ok, create_rotate_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec revoke_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def revoke_api_token(_parent, %{token_id: token_id}, %{context: %{current_user: current_user}}) do
    with {:ok, token_entropy_id} <- resolve_token_entropy_id(token_id) do
      case Accounts.revoke_api_token(current_user.id, token_entropy_id) do
        {:ok, token} ->
          {:ok, %{api_token: token, errors: []}}

        {:error, :not_found} ->
          {:ok, revoke_error_payload("NOT_FOUND", "token not found")}

        {:error, _changeset} ->
          {:ok, revoke_error_payload("INVALID_ARGUMENT", "invalid token payload")}
      end
    else
      {:error, :invalid_id} ->
        {:ok, revoke_error_payload("INVALID_ID", "invalid token id", "tokenId")}
    end
  end

  def revoke_api_token(_parent, _args, _resolution),
    do: {:ok, revoke_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec rotate_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def rotate_api_token(_parent, %{token_id: token_id} = args, %{
        context: %{current_user: current_user}
      }) do
    attrs = Input.take(args, [:label, :expires_at])

    with {:ok, token_entropy_id} <- resolve_token_entropy_id(token_id) do
      case Accounts.rotate_api_token(current_user.id, token_entropy_id, attrs) do
        {:ok, %{plain_text_token: plain_text_token, api_token: api_token}} ->
          {:ok, %{plain_text_token: plain_text_token, api_token: api_token, errors: []}}

        {:error, :not_found} ->
          {:ok, create_rotate_error_payload("NOT_FOUND", "token not found")}

        {:error, changeset} ->
          {:ok,
           create_rotate_error_payload(
             "INVALID_ARGUMENT",
             GraphQLErrors.changeset_first_message(changeset)
           )}
      end
    else
      {:error, :invalid_id} ->
        {:ok, create_rotate_error_payload("INVALID_ID", "invalid token id", "tokenId")}
    end
  end

  def rotate_api_token(_parent, _args, _resolution),
    do: {:ok, create_rotate_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  defp resolve_token_entropy_id(token_id) do
    case GlobalId.decode_uuid(token_id, :api_token) do
      {:ok, entropy_id} -> {:ok, entropy_id}
      :error -> {:error, :invalid_id}
    end
  end

  defp create_rotate_error_payload(code, message, field \\ nil) do
    %{
      plain_text_token: nil,
      api_token: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp create_rotate_error_payload(error) when is_map(error) do
    %{
      plain_text_token: nil,
      api_token: nil,
      errors: [error]
    }
  end

  defp revoke_error_payload(code, message, field \\ nil) do
    %{
      api_token: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp revoke_error_payload(error) when is_map(error) do
    %{
      api_token: nil,
      errors: [error]
    }
  end
end
