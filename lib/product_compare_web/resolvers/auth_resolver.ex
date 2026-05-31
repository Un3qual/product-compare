defmodule ProductCompareWeb.Resolvers.AuthResolver do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.SessionMutationBridge

  @invalid_credentials_message "invalid email or password"
  @invalid_origin_message "cross-origin request rejected"
  @invalid_token_message "invalid or expired token"

  @spec viewer(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Accounts.User.t() | nil}
  def viewer(_parent, _args, %{context: %{current_user: current_user}}), do: {:ok, current_user}
  def viewer(_parent, _args, _resolution), do: {:ok, nil}

  @spec register(any(), %{email: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def register(_parent, args, resolution) do
    with :ok <- require_trusted_request_origin(resolution),
         {:ok, user} <- Accounts.register_user(args) do
      user
      |> Accounts.generate_user_session_token()
      |> SessionMutationBridge.renew_session_with_user_token()

      Accounts.deliver_user_confirmation_instructions(user)
      {:ok, auth_payload(user)}
    else
      {:error, :invalid_origin} ->
        {:ok, auth_error_payload("INVALID_ORIGIN", @invalid_origin_message)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:ok, auth_changeset_error_payload(changeset)}
    end
  end

  @spec login(any(), %{email: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def login(_parent, %{email: email, password: password}, resolution) do
    with :ok <- require_trusted_request_origin(resolution),
         user when not is_nil(user) <-
           Accounts.authenticate_user_by_email_and_password(email, password),
         user_token when is_binary(user_token) <- Accounts.generate_user_session_token(user) do
      SessionMutationBridge.renew_session_with_user_token(user_token)

      {:ok, auth_payload(user)}
    else
      {:error, :invalid_origin} ->
        {:ok, auth_error_payload("INVALID_ORIGIN", @invalid_origin_message)}

      nil ->
        {:ok, auth_error_payload("INVALID_CREDENTIALS", @invalid_credentials_message)}
    end
  end

  @spec logout(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def logout(_parent, _args, resolution) do
    with :ok <- require_trusted_request_origin(resolution) do
      if user_token = get_in(resolution.context, [:session_user_token]) do
        Accounts.delete_user_session_token(user_token)
      end

      SessionMutationBridge.drop_session()
      {:ok, %{ok: true, errors: []}}
    else
      {:error, :invalid_origin} ->
        {:ok,
         %{
           ok: false,
           errors: [GraphQLErrors.mutation_error("INVALID_ORIGIN", @invalid_origin_message)]
         }}
    end
  end

  @spec forgot_password(any(), %{email: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def forgot_password(_parent, %{email: email}, resolution) do
    with :ok <- require_trusted_request_origin(resolution) do
      if user = Accounts.get_user_by_email(email) do
        Accounts.deliver_user_reset_password_instructions(user)
      end

      {:ok, ok_payload()}
    else
      {:error, :invalid_origin} ->
        {:ok, action_error_payload("INVALID_ORIGIN", @invalid_origin_message)}
    end
  end

  @spec reset_password(any(), %{token: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def reset_password(_parent, %{token: token, password: password}, resolution) do
    with :ok <- require_trusted_request_origin(resolution) do
      case Accounts.reset_user_password(token, %{password: password}) do
        {:ok, _user} ->
          SessionMutationBridge.drop_session()
          {:ok, ok_payload()}

        {:error, :invalid_token} ->
          {:ok, action_error_payload("INVALID_TOKEN", @invalid_token_message, "token")}

        {:error, %Ecto.Changeset{} = changeset} ->
          {:ok, action_changeset_error_payload(changeset)}
      end
    else
      {:error, :invalid_origin} ->
        {:ok, action_error_payload("INVALID_ORIGIN", @invalid_origin_message)}
    end
  end

  @spec verify_email(any(), %{token: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def verify_email(_parent, %{token: token}, resolution) do
    with :ok <- require_trusted_request_origin(resolution) do
      case Accounts.confirm_user(token) do
        {:ok, _user} ->
          {:ok, ok_payload()}

        {:error, :invalid_token} ->
          {:ok, action_error_payload("INVALID_TOKEN", @invalid_token_message, "token")}
      end
    else
      {:error, :invalid_origin} ->
        {:ok, action_error_payload("INVALID_ORIGIN", @invalid_origin_message)}
    end
  end

  @spec my_api_tokens(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_api_tokens(_parent, args, %{context: %{current_user: current_user}}) do
    args = args || %{}
    status_filter = Input.fetch_value(args, :status, :all)
    query = Accounts.list_api_tokens_query(current_user.id, status: status_filter)
    connection_args = args |> Input.drop_key(:status) |> Input.connection_args()

    Connection.from_query_result(query, connection_args, Repo)
  end

  def my_api_tokens(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec create_api_token(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_api_token(_parent, args, %{context: %{current_user: current_user}}) do
    attrs = Input.take_present(args, [:label, :expires_at])

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
    attrs = Input.take_present(args, [:label, :expires_at])

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

  defp require_trusted_request_origin(%{context: %{trusted_request_origin?: true}}), do: :ok
  defp require_trusted_request_origin(_resolution), do: {:error, :invalid_origin}

  defp auth_payload(user) do
    %{
      viewer: user,
      errors: []
    }
  end

  defp ok_payload do
    %{
      ok: true,
      errors: []
    }
  end

  defp auth_error_payload(code, message, field \\ nil) do
    %{
      viewer: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp action_error_payload(code, message, field \\ nil) do
    %{
      ok: false,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp auth_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    errors =
      GraphQLErrors.changeset_mutation_errors(changeset)

    %{
      viewer: nil,
      errors: errors
    }
  end

  defp action_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      ok: false,
      errors: GraphQLErrors.changeset_mutation_errors(changeset)
    }
  end

  defp resolve_token_entropy_id(token_id) do
    case GlobalId.decode_uuid(token_id, :api_token) do
      {:ok, entropy_id} ->
        {:ok, entropy_id}

      :error ->
        {:error, :invalid_id}
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
