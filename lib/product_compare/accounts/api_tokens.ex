defmodule ProductCompare.Accounts.ApiTokens do
  @moduledoc false

  alias ProductCompare.Accounts.ApiTokens.Authentication
  alias ProductCompare.Accounts.ApiTokens.Lifecycle
  alias ProductCompare.Accounts.ApiTokens.Queries
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User

  @spec create_api_token(pos_integer(), map()) ::
          {:ok, %{plain_text_token: String.t(), api_token: ApiToken.t()}}
          | {:error, Ecto.Changeset.t()}
  def create_api_token(user_id, attrs \\ %{}), do: Lifecycle.create(user_id, attrs)

  @spec authenticate_api_token(String.t()) :: {:ok, User.t(), ApiToken.t()} | :error
  def authenticate_api_token(plain_text_token)

  def authenticate_api_token(""), do: Authentication.authenticate("")

  def authenticate_api_token(plain_text_token) when not is_binary(plain_text_token) do
    Authentication.authenticate(plain_text_token)
  end

  def authenticate_api_token(plain_text_token),
    do: Authentication.authenticate(plain_text_token)

  @spec list_api_tokens_query(pos_integer(), keyword() | map()) :: Ecto.Query.t()
  def list_api_tokens_query(user_id, opts \\ []), do: Queries.list_query(user_id, opts)

  @spec list_api_tokens(pos_integer(), keyword() | map()) :: [ApiToken.t()]
  def list_api_tokens(user_id, opts \\ []), do: Queries.list(user_id, opts)

  @spec get_api_token_for_user(User.t(), binary()) :: ApiToken.t() | nil
  def get_api_token_for_user(%User{id: user_id}, token_entropy_id) do
    Queries.get_for_user(user_id, token_entropy_id)
  end

  @spec get_api_tokens_for_user(User.t(), [binary()]) ::
          %{optional(binary()) => ApiToken.t() | nil}
  def get_api_tokens_for_user(%User{id: user_id}, token_entropy_ids) do
    Queries.get_many_for_user(user_id, token_entropy_ids)
  end

  @spec revoke_api_token(pos_integer(), Ecto.UUID.t()) ::
          {:ok, ApiToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke_api_token(user_id, token_entropy_id) when is_binary(token_entropy_id),
    do: Lifecycle.revoke(user_id, token_entropy_id)

  def revoke_api_token(_user_id, _token_entropy_id), do: {:error, :not_found}

  @spec rotate_api_token(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok,
           %{
             plain_text_token: String.t(),
             api_token: ApiToken.t(),
             revoked_api_token: ApiToken.t()
           }}
          | {:error, :not_found | Ecto.Changeset.t()}
  def rotate_api_token(user_id, token_entropy_id, attrs \\ %{})

  def rotate_api_token(user_id, token_entropy_id, attrs) when is_binary(token_entropy_id),
    do: Lifecycle.rotate(user_id, token_entropy_id, attrs)

  def rotate_api_token(_user_id, _token_entropy_id, _attrs), do: {:error, :not_found}
end
