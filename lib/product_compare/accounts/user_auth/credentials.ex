defmodule ProductCompare.Accounts.UserAuth.Credentials do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User

  @spec authenticate_user_by_email_and_password(any(), any()) :: User.t() | nil
  def authenticate_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    email
    |> User.normalize_email()
    |> fetch_user_for_auth()
    |> verify_password(password)
  end

  def authenticate_user_by_email_and_password(_email, _password) do
    Argon2.no_user_verify()
    nil
  end

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
end
