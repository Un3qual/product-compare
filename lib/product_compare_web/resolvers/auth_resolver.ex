defmodule ProductCompareWeb.Resolvers.AuthResolver do
  @moduledoc false

  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.Resolvers.Auth.AccountActions
  alias ProductCompareWeb.Resolvers.Auth.ApiTokens

  @spec viewer(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Accounts.User.t() | nil}
  def viewer(parent, args, %{context: %{current_user: _current_user}} = resolution),
    do: AccountActions.viewer(parent, args, resolution)

  def viewer(parent, args, resolution), do: AccountActions.viewer(parent, args, resolution)

  @spec register(any(), %{email: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def register(parent, args, resolution), do: AccountActions.register(parent, args, resolution)

  @spec login(any(), %{email: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def login(parent, %{email: _email, password: _password} = args, resolution),
    do: AccountActions.login(parent, args, resolution)

  @spec logout(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def logout(parent, args, resolution), do: AccountActions.logout(parent, args, resolution)

  @spec forgot_password(any(), %{email: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def forgot_password(parent, %{email: _email} = args, resolution),
    do: AccountActions.forgot_password(parent, args, resolution)

  @spec reset_password(any(), %{token: String.t(), password: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def reset_password(parent, %{token: _token, password: _password} = args, resolution),
    do: AccountActions.reset_password(parent, args, resolution)

  @spec verify_email(any(), %{token: String.t()}, Absinthe.Resolution.t()) :: {:ok, map()}
  def verify_email(parent, %{token: _token} = args, resolution),
    do: AccountActions.verify_email(parent, args, resolution)

  @spec my_api_tokens(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_api_tokens(
        parent,
        args,
        %{
          context: %{current_user: _current_user, loader: %Dataloader{}}
        } = resolution
      ),
      do: ApiTokens.my_api_tokens(parent, args, resolution)

  def my_api_tokens(parent, args, %{context: %{current_user: _current_user}} = resolution),
    do: ApiTokens.my_api_tokens(parent, args, resolution)

  def my_api_tokens(parent, args, resolution),
    do: ApiTokens.my_api_tokens(parent, args, resolution)

  @spec create_api_token(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def create_api_token(parent, args, %{context: %{current_user: _current_user}} = resolution),
    do: ApiTokens.create_api_token(parent, args, resolution)

  def create_api_token(parent, args, resolution),
    do: ApiTokens.create_api_token(parent, args, resolution)

  @spec revoke_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def revoke_api_token(
        parent,
        %{token_id: _token_id} = args,
        %{context: %{current_user: _current_user}} = resolution
      ),
      do: ApiTokens.revoke_api_token(parent, args, resolution)

  def revoke_api_token(parent, args, resolution),
    do: ApiTokens.revoke_api_token(parent, args, resolution)

  @spec rotate_api_token(any(), %{token_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def rotate_api_token(
        parent,
        %{token_id: _token_id} = args,
        %{context: %{current_user: _current_user}} = resolution
      ),
      do: ApiTokens.rotate_api_token(parent, args, resolution)

  def rotate_api_token(parent, args, resolution),
    do: ApiTokens.rotate_api_token(parent, args, resolution)
end
