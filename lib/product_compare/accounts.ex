defmodule ProductCompare.Accounts do
  @moduledoc """
  Accounts context for users, authentication, API tokens, and reputation totals.
  """

  alias ProductCompare.Accounts.{ApiTokens, Reputation, UserAuth, Users}
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

  @deliver_user_confirmation_instructions_hook :deliver_user_confirmation_instructions
  @deliver_user_reset_password_instructions_hook :deliver_user_reset_password_instructions

  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs), do: Users.create_user(attrs)

  @spec register_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def register_user(attrs), do: Users.register_user(attrs)

  @spec get_user!(pos_integer()) :: User.t()
  def get_user!(id), do: Users.get_user!(id)

  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email), do: Users.get_user_by_email(email)

  @doc "Updates operator access for trusted seed and bootstrap code."
  @spec set_operator_access(User.t(), boolean()) ::
          {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def set_operator_access(%User{} = user, is_operator) when is_boolean(is_operator),
    do: Users.set_operator_access(user, is_operator)

  @doc """
  Bootstraps a trusted operator account without taking over an existing account.

  A missing account is created with the supplied password, granted operator
  access, and assigned the supplied reputation in one transaction. An existing
  operator is returned unchanged. An existing non-operator fails closed, even
  if it appears concurrently while the account is being created.
  """
  @spec bootstrap_operator_user(String.t(), String.t(), integer()) ::
          {:ok, User.t()} | {:error, :existing_non_operator | Ecto.Changeset.t()}
  def bootstrap_operator_user(email, password, reputation_points)
      when is_binary(email) and is_binary(password) and is_integer(reputation_points) do
    Users.bootstrap_operator_user(email, password, reputation_points)
  end

  @doc """
  Ensures a user exists with a usable password hash.

  If the user does not exist, this creates one with the supplied password. If the
  existing user is missing a usable Argon2 password hash, this repairs the user
  by setting the supplied password. If the existing user already has a usable
  password hash, this returns `{:ok, user}` without verifying or updating the
  supplied password.
  """
  @spec ensure_user_with_password(String.t(), String.t()) ::
          {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def ensure_user_with_password(email, password) when is_binary(email) and is_binary(password) do
    Users.ensure_user_with_password(email, password)
  end

  @spec authenticate_user_by_email_and_password(String.t(), String.t()) :: User.t() | nil
  defdelegate authenticate_user_by_email_and_password(email, password), to: UserAuth

  @spec generate_user_session_token(User.t()) :: String.t() | nil
  defdelegate generate_user_session_token(user), to: UserAuth

  @spec get_user_by_session_token(String.t()) :: User.t() | nil
  defdelegate get_user_by_session_token(token), to: UserAuth

  @spec delete_user_session_token(String.t()) :: :ok
  defdelegate delete_user_session_token(token), to: UserAuth

  @spec deliver_user_confirmation_instructions(User.t()) :: :ok
  def deliver_user_confirmation_instructions(%User{} = user) do
    case configured_user_token_delivery(@deliver_user_confirmation_instructions_hook, user) do
      nil -> :ok
      delivery_fun -> UserAuth.deliver_user_confirmation_instructions(user, delivery_fun)
    end
  end

  @spec deliver_user_confirmation_instructions(User.t(), (String.t() -> any())) :: :ok
  defdelegate deliver_user_confirmation_instructions(user, delivery_fun), to: UserAuth

  @spec confirm_user(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  defdelegate confirm_user(token), to: UserAuth

  @spec deliver_user_reset_password_instructions(User.t()) :: :ok
  def deliver_user_reset_password_instructions(%User{} = user) do
    case configured_user_token_delivery(@deliver_user_reset_password_instructions_hook, user) do
      nil -> :ok
      delivery_fun -> UserAuth.deliver_user_reset_password_instructions(user, delivery_fun)
    end
  end

  @spec deliver_user_reset_password_instructions(User.t(), (String.t() -> any())) :: :ok
  defdelegate deliver_user_reset_password_instructions(user, delivery_fun), to: UserAuth

  @spec get_user_by_reset_password_token(String.t()) :: User.t() | nil
  defdelegate get_user_by_reset_password_token(token), to: UserAuth

  @spec reset_user_password(String.t(), map()) :: {:ok, User.t()} | {:error, term()}
  defdelegate reset_user_password(token, attrs), to: UserAuth

  @spec create_api_token(pos_integer(), map()) ::
          {:ok, %{plain_text_token: String.t(), api_token: ApiToken.t()}}
          | {:error, Ecto.Changeset.t()}
  def create_api_token(user_id, attrs \\ %{}), do: ApiTokens.create_api_token(user_id, attrs)

  @spec authenticate_api_token(String.t()) :: {:ok, User.t(), ApiToken.t()} | :error
  def authenticate_api_token(plain_text_token)

  def authenticate_api_token(""), do: :error

  def authenticate_api_token(plain_text_token) when not is_binary(plain_text_token),
    do: :error

  def authenticate_api_token(plain_text_token),
    do: ApiTokens.authenticate_api_token(plain_text_token)

  @spec list_api_tokens_query(pos_integer(), keyword() | map()) :: Ecto.Query.t()
  def list_api_tokens_query(user_id, opts \\ []),
    do: ApiTokens.list_api_tokens_query(user_id, opts)

  @spec list_api_tokens(pos_integer(), keyword() | map()) :: [ApiToken.t()]
  def list_api_tokens(user_id, opts \\ []), do: ApiTokens.list_api_tokens(user_id, opts)

  @doc """
  Fetches an API token owned by a user by a raw entropy ID value.

  Invalid UUID binaries return `nil` instead of raising.
  """
  @spec get_api_token_for_user(User.t(), binary()) :: ApiToken.t() | nil
  def get_api_token_for_user(%User{} = user, token_entropy_id)
      when is_binary(token_entropy_id) do
    ApiTokens.get_api_token_for_user(user, token_entropy_id)
  end

  @spec get_api_tokens_for_user(User.t(), [binary()]) ::
          %{optional(binary()) => ApiToken.t() | nil}
  def get_api_tokens_for_user(%User{} = user, token_entropy_ids)
      when is_list(token_entropy_ids) do
    ApiTokens.get_api_tokens_for_user(user, token_entropy_ids)
  end

  @spec revoke_api_token(pos_integer(), Ecto.UUID.t()) ::
          {:ok, ApiToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke_api_token(user_id, token_entropy_id) when is_binary(token_entropy_id),
    do: ApiTokens.revoke_api_token(user_id, token_entropy_id)

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
    do: ApiTokens.rotate_api_token(user_id, token_entropy_id, attrs)

  def rotate_api_token(_user_id, _token_entropy_id, _attrs), do: {:error, :not_found}

  @spec upsert_user_reputation(pos_integer(), integer()) ::
          {:ok, UserReputation.t()} | {:error, Ecto.Changeset.t()}
  def upsert_user_reputation(user_id, points),
    do: Reputation.upsert_user_reputation(user_id, points)

  # Browser auth recovery flows stay mailer-agnostic here; production delivery
  # can be injected later without changing the GraphQL contract or the token logic.
  defp configured_user_token_delivery(hook, user) do
    case Application.get_env(:product_compare, __MODULE__, [])
         |> Keyword.fetch(hook) do
      :error ->
        nil

      {:ok, fun} when is_function(fun, 2) ->
        &fun.(user, &1)

      {:ok, invalid} ->
        raise ArgumentError,
              "expected #{inspect(__MODULE__)} #{inspect(hook)} hook to be a 2-arity function, got: #{inspect(invalid)}"
    end
  end
end
