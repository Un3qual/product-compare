defmodule ProductCompareWeb.Resolvers.AuthResolver do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId
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
           Accounts.authenticate_user_by_email_and_password(email, password) do
      user
      |> Accounts.generate_user_session_token()
      |> SessionMutationBridge.renew_session_with_user_token()

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
         %{ok: false, errors: [mutation_error("INVALID_ORIGIN", @invalid_origin_message, nil)]}}
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
          {:ok, map()} | {:error, String.t()}
  def my_api_tokens(_parent, args, %{context: %{current_user: current_user}}) do
    status_filter = Map.get(args || %{}, :status, :all)
    query = Accounts.list_api_tokens_query(current_user.id, status: status_filter)
    connection_args = Map.drop(args || %{}, [:status])

    case Connection.from_query(query, connection_args, Repo) do
      {:ok, connection} -> {:ok, connection}
      {:error, :invalid_cursor} -> {:error, "invalid cursor"}
    end
  end

  def my_api_tokens(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec create_api_token(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_api_token(_parent, args, %{context: %{current_user: current_user}}) do
    attrs =
      args
      |> Map.take([:label, :expires_at])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    case Accounts.create_api_token(current_user.id, attrs) do
      {:ok, result} ->
        {:ok, Map.put(result, :errors, [])}

      {:error, changeset} ->
        {:ok, create_rotate_error_payload("INVALID_ARGUMENT", first_changeset_error(changeset))}
    end
  end

  def create_api_token(_parent, _args, _resolution),
    do: {:ok, create_rotate_error_payload("UNAUTHORIZED", "unauthorized")}

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
    do: {:ok, revoke_error_payload("UNAUTHORIZED", "unauthorized")}

  @spec rotate_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def rotate_api_token(_parent, %{token_id: token_id} = args, %{
        context: %{current_user: current_user}
      }) do
    attrs =
      args
      |> Map.take([:label, :expires_at])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    with {:ok, token_entropy_id} <- resolve_token_entropy_id(token_id) do
      case Accounts.rotate_api_token(current_user.id, token_entropy_id, attrs) do
        {:ok, %{plain_text_token: plain_text_token, api_token: api_token}} ->
          {:ok, %{plain_text_token: plain_text_token, api_token: api_token, errors: []}}

        {:error, :not_found} ->
          {:ok, create_rotate_error_payload("NOT_FOUND", "token not found")}

        {:error, changeset} ->
          {:ok, create_rotate_error_payload("INVALID_ARGUMENT", first_changeset_error(changeset))}
      end
    else
      {:error, :invalid_id} ->
        {:ok, create_rotate_error_payload("INVALID_ID", "invalid token id", "tokenId")}
    end
  end

  def rotate_api_token(_parent, _args, _resolution),
    do: {:ok, create_rotate_error_payload("UNAUTHORIZED", "unauthorized")}

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
      errors: [mutation_error(code, message, field)]
    }
  end

  defp action_error_payload(code, message, field \\ nil) do
    %{
      ok: false,
      errors: [mutation_error(code, message, field)]
    }
  end

  defp auth_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    errors =
      changeset_errors(changeset)

    %{
      viewer: nil,
      errors: errors
    }
  end

  defp action_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      ok: false,
      errors: changeset_errors(changeset)
    }
  end

  defp first_changeset_error(%Ecto.Changeset{errors: [{_field, {message, _opts}} | _]}),
    do: message

  defp first_changeset_error(_changeset), do: "invalid payload"

  defp changeset_errors(%Ecto.Changeset{} = changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {message, opts} ->
      opts_by_key = Map.new(opts, fn {k, v} -> {to_string(k), v} end)

      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts_by_key
        |> Map.get(key, key)
        |> to_string()
      end)
    end)
    |> Enum.flat_map(fn {field, messages} ->
      Enum.map(messages, &mutation_error("INVALID_ARGUMENT", &1, Atom.to_string(field)))
    end)
  end

  defp resolve_token_entropy_id(token_id) do
    case GlobalId.decode(token_id) do
      {:ok, {:api_token, entropy_id}} ->
        {:ok, entropy_id}

      _ ->
        {:error, :invalid_id}
    end
  end

  defp create_rotate_error_payload(code, message, field \\ nil) do
    %{
      plain_text_token: nil,
      api_token: nil,
      errors: [mutation_error(code, message, field)]
    }
  end

  defp revoke_error_payload(code, message, field \\ nil) do
    %{
      api_token: nil,
      errors: [mutation_error(code, message, field)]
    }
  end

  defp mutation_error(code, message, field) do
    %{code: code, message: message, field: field}
  end
end
