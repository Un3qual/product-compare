defmodule ProductCompare.Accounts.UserAuth do
  @moduledoc """
  User authentication helpers for password-backed login and token issuance.

  Session token creation re-checks the current password hash under a row lock so
  auth state captured before a password reset cannot mint a fresh session after
  the reset commits. Tests may also install zero-arity hooks in
  `Application.get_env(:product_compare, __MODULE__)` to pause specific
  concurrency windows deterministically.
  """

  alias ProductCompare.Accounts.UserAuth.Credentials
  alias ProductCompare.Accounts.UserAuth.EmailTokens
  alias ProductCompare.Accounts.UserAuth.Sessions
  alias ProductCompareSchemas.Accounts.User

  @spec authenticate_user_by_email_and_password(String.t(), String.t()) :: User.t() | nil
  def authenticate_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    Credentials.authenticate_user_by_email_and_password(email, password)
  end

  def authenticate_user_by_email_and_password(_email, _password) do
    Credentials.authenticate_user_by_email_and_password(nil, nil)
  end

  @spec generate_user_session_token(User.t()) :: String.t() | nil
  def generate_user_session_token(%User{} = user),
    do: Sessions.generate_user_session_token(user)

  @spec get_user_by_session_token(String.t()) :: User.t() | nil
  def get_user_by_session_token(token) when is_binary(token),
    do: Sessions.get_user_by_session_token(token)

  def get_user_by_session_token(_token), do: nil

  @spec delete_user_session_token(String.t()) :: :ok
  def delete_user_session_token(token) when is_binary(token),
    do: Sessions.delete_user_session_token(token)

  def delete_user_session_token(_token), do: :ok

  @spec deliver_user_confirmation_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_user_confirmation_instructions(%User{} = user, delivery_fun),
    do: EmailTokens.deliver_confirmation_instructions(user, delivery_fun)

  @spec confirm_user(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  def confirm_user(token) when is_binary(token), do: EmailTokens.confirm_user(token)
  def confirm_user(_token), do: {:error, :invalid_token}

  @spec deliver_user_reset_password_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_user_reset_password_instructions(%User{} = user, delivery_fun),
    do: EmailTokens.deliver_reset_password_instructions(user, delivery_fun)

  @spec get_user_by_reset_password_token(String.t()) :: User.t() | nil
  def get_user_by_reset_password_token(token) when is_binary(token),
    do: EmailTokens.get_user_by_reset_password_token(token)

  def get_user_by_reset_password_token(_token), do: nil

  @spec reset_user_password(String.t(), map()) ::
          {:ok, User.t()} | {:error, :invalid_token | Ecto.Changeset.t()}
  def reset_user_password(token, attrs) when is_binary(token) and is_map(attrs),
    do: EmailTokens.reset_user_password(token, attrs)

  def reset_user_password(_token, _attrs), do: {:error, :invalid_token}
end
