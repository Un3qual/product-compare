defmodule ProductCompareWeb.Resolvers.Auth.AccountActions do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
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

  defp require_trusted_request_origin(%{context: %{trusted_request_origin?: true}}), do: :ok
  defp require_trusted_request_origin(_resolution), do: {:error, :invalid_origin}

  defp auth_payload(user), do: %{viewer: user, errors: []}
  defp ok_payload, do: %{ok: true, errors: []}

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
    %{
      viewer: nil,
      errors: GraphQLErrors.changeset_mutation_errors(changeset)
    }
  end

  defp action_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      ok: false,
      errors: GraphQLErrors.changeset_mutation_errors(changeset)
    }
  end
end
