defmodule ProductCompare.Accounts.UserAuth do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @session_context "session"
  @session_token_bytes 32
  @session_validity_in_days 60

  @spec authenticate_user_by_email_and_password(String.t(), String.t()) :: User.t() | nil
  def authenticate_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    email
    |> String.downcase()
    |> fetch_user_for_auth()
    |> verify_password(password)
  end

  def authenticate_user_by_email_and_password(_email, _password) do
    Argon2.no_user_verify()
    nil
  end

  @spec generate_user_session_token(User.t()) :: String.t()
  def generate_user_session_token(%User{} = user) do
    raw_token = :crypto.strong_rand_bytes(@session_token_bytes)
    encoded_token = Base.url_encode64(raw_token, padding: false)
    expires_at = session_expiration()

    %UserSessionToken{}
    |> UserSessionToken.changeset(%{
      user_id: user.id,
      token_hash: session_token_hash(raw_token),
      context: @session_context,
      expires_at: expires_at
    })
    |> Repo.insert!()

    encoded_token
  end

  @spec get_user_by_session_token(String.t()) :: User.t() | nil
  def get_user_by_session_token(token) when is_binary(token) do
    with {:ok, raw_token} <- Base.url_decode64(token, padding: false) do
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      from(token_row in UserSessionToken,
        join: user in assoc(token_row, :user),
        where: token_row.context == ^@session_context,
        where: token_row.token_hash == ^session_token_hash(raw_token),
        where: token_row.expires_at > ^now,
        select: user
      )
      |> Repo.one()
    else
      :error -> nil
    end
  end

  def get_user_by_session_token(_token), do: nil

  @spec delete_user_session_token(String.t()) :: :ok
  def delete_user_session_token(token) when is_binary(token) do
    case Base.url_decode64(token, padding: false) do
      {:ok, raw_token} ->
        from(token_row in UserSessionToken,
          where: token_row.context == ^@session_context,
          where: token_row.token_hash == ^session_token_hash(raw_token)
        )
        |> Repo.delete_all()

      :error ->
        :ok
    end

    :ok
  end

  def delete_user_session_token(_token), do: :ok

  defp fetch_user_for_auth(email), do: Repo.get_by(User, email: email)

  defp verify_password(%User{hashed_password: hashed_password} = user, password)
       when is_binary(hashed_password) and hashed_password != "" do
    if String.starts_with?(hashed_password, "$argon2") do
      if Argon2.verify_pass(password, hashed_password), do: user, else: nil
    else
      Argon2.no_user_verify()
      nil
    end
  end

  defp verify_password(_user, _password) do
    Argon2.no_user_verify()
    nil
  end

  defp session_expiration do
    DateTime.utc_now()
    |> DateTime.truncate(:microsecond)
    |> DateTime.add(@session_validity_in_days * 24 * 60 * 60, :second)
  end

  defp session_token_hash(raw_token), do: :crypto.hash(:sha256, raw_token)
end
