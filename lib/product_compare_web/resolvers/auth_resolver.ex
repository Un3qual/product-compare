defmodule ProductCompareWeb.Resolvers.AuthResolver do
  @moduledoc false

  alias ProductCompare.Accounts
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec viewer(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Accounts.User.t() | nil}
  def viewer(_parent, _args, %{context: %{current_user: current_user}}), do: {:ok, current_user}
  def viewer(_parent, _args, _resolution), do: {:ok, nil}

  @spec my_api_tokens(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def my_api_tokens(_parent, args, %{context: %{current_user: current_user}}) do
    tokens = Accounts.list_api_tokens(current_user.id)
    {:ok, Connection.from_list(tokens, args || %{})}
  end

  def my_api_tokens(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec create_api_token(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def create_api_token(_parent, args, %{context: %{current_user: current_user}}) do
    attrs =
      args
      |> Map.take([:label, :expires_at])
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    case Accounts.create_api_token(current_user.id, attrs) do
      {:ok, result} ->
        {:ok, result}

      {:error, changeset} ->
        {:error, first_changeset_error(changeset)}
    end
  end

  def create_api_token(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec revoke_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Accounts.ApiToken.t()} | {:error, String.t()}
  def revoke_api_token(_parent, %{token_id: token_id}, %{context: %{current_user: current_user}}) do
    with {:ok, token_entropy_id} <- resolve_token_entropy_id(token_id) do
      case Accounts.revoke_api_token(current_user.id, token_entropy_id) do
        {:ok, token} -> {:ok, token}
        {:error, :not_found} -> {:error, "token not found"}
        {:error, _changeset} -> {:error, "invalid token payload"}
      end
    end
  end

  def revoke_api_token(_parent, _args, _resolution), do: {:error, "unauthorized"}

  defp first_changeset_error(changeset) do
    {_field, {message, _opts}} = List.first(changeset.errors)
    message
  end

  defp resolve_token_entropy_id(token_id) do
    case GlobalId.decode(token_id) do
      {:ok, {:api_token, entropy_id}} -> {:ok, entropy_id}
      {:ok, {_other_type, _id}} -> {:error, "token not found"}
      :error -> {:ok, token_id}
    end
  end
end
