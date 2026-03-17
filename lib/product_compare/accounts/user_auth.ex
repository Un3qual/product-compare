defmodule ProductCompare.Accounts.UserAuth do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @confirm_context "confirm"
  @reset_password_context "reset_password"
  @session_context "session"
  @token_bytes 32
  @confirm_validity_in_days 7
  @reset_password_validity_in_days 1
  @session_validity_in_days 60

  @spec authenticate_user_by_email_and_password(String.t(), String.t()) :: User.t() | nil
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

  @spec generate_user_session_token(User.t()) :: String.t()
  def generate_user_session_token(%User{} = user) do
    issue_user_token(user, @session_context, session_expiration())
  end

  @spec get_user_by_session_token(String.t()) :: User.t() | nil
  def get_user_by_session_token(token) when is_binary(token) do
    get_user_by_token(token, @session_context)
  end

  def get_user_by_session_token(_token), do: nil

  @spec delete_user_session_token(String.t()) :: :ok
  def delete_user_session_token(token) when is_binary(token) do
    delete_token(token, @session_context)
    :ok
  end

  def delete_user_session_token(_token), do: :ok

  @spec deliver_user_confirmation_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_user_confirmation_instructions(%User{} = user, delivery_fun)
      when is_function(delivery_fun, 1) do
    token =
      issue_user_token(
        user,
        @confirm_context,
        email_token_expiration(@confirm_validity_in_days),
        sent_to: user.email,
        replace_context?: true
      )

    delivery_fun.(token)
    :ok
  end

  @spec confirm_user(String.t()) ::
          {:ok, User.t()} | {:error, :invalid_token | Ecto.Changeset.t()}
  def confirm_user(token) when is_binary(token) do
    case get_user_by_email_token(token, @confirm_context) do
      %User{} = user ->
        with {:ok, confirmed_user} <-
               Repo.transaction(fn ->
                 case user
                      |> User.confirm_changeset()
                      |> Repo.update() do
                   {:ok, confirmed_user} ->
                     clear_user_tokens(user.id, [@confirm_context])
                     confirmed_user

                   {:error, %Ecto.Changeset{} = changeset} ->
                     Repo.rollback(changeset)
                 end
               end) do
          {:ok, confirmed_user}
        end

      nil ->
        {:error, :invalid_token}
    end
  end

  def confirm_user(_token), do: {:error, :invalid_token}

  @spec deliver_user_reset_password_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_user_reset_password_instructions(%User{} = user, delivery_fun)
      when is_function(delivery_fun, 1) do
    token =
      issue_user_token(
        user,
        @reset_password_context,
        email_token_expiration(@reset_password_validity_in_days),
        sent_to: user.email,
        replace_context?: true
      )

    delivery_fun.(token)
    :ok
  end

  @spec get_user_by_reset_password_token(String.t()) :: User.t() | nil
  def get_user_by_reset_password_token(token) when is_binary(token) do
    get_user_by_email_token(token, @reset_password_context)
  end

  def get_user_by_reset_password_token(_token), do: nil

  @spec reset_user_password(String.t(), map()) ::
          {:ok, User.t()} | {:error, :invalid_token | Ecto.Changeset.t()}
  def reset_user_password(token, attrs) when is_binary(token) and is_map(attrs) do
    case get_user_by_reset_password_token(token) do
      %User{} = user ->
        with {:ok, updated_user} <-
               Repo.transaction(fn ->
                 case user
                      |> User.password_changeset(attrs)
                      |> Repo.update() do
                   {:ok, updated_user} ->
                     clear_user_tokens(user.id)
                     updated_user

                   {:error, %Ecto.Changeset{} = changeset} ->
                     Repo.rollback(changeset)
                 end
               end) do
          {:ok, updated_user}
        end

      nil ->
        {:error, :invalid_token}
    end
  end

  def reset_user_password(_token, _attrs), do: {:error, :invalid_token}

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

  defp get_user_by_email_token(token, context) do
    with {:ok, raw_token} <- Base.url_decode64(token, padding: false) do
      now = current_time()

      from(token_row in UserSessionToken,
        join: user in assoc(token_row, :user),
        where: token_row.context == ^context,
        where: token_row.token_hash == ^token_hash(raw_token),
        where: token_row.expires_at > ^now,
        where: token_row.sent_to == user.email,
        select: user
      )
      |> Repo.one()
    else
      :error -> nil
    end
  end

  defp get_user_by_token(token, context) do
    with {:ok, raw_token} <- Base.url_decode64(token, padding: false) do
      now = current_time()

      from(token_row in UserSessionToken,
        join: user in assoc(token_row, :user),
        where: token_row.context == ^context,
        where: token_row.token_hash == ^token_hash(raw_token),
        where: token_row.expires_at > ^now,
        select: user
      )
      |> Repo.one()
    else
      :error -> nil
    end
  end

  defp issue_user_token(%User{} = user, context, expires_at, opts \\ []) do
    raw_token = :crypto.strong_rand_bytes(@token_bytes)
    encoded_token = Base.url_encode64(raw_token, padding: false)
    sent_to = Keyword.get(opts, :sent_to)

    token_attrs = %{
      user_id: user.id,
      token_hash: token_hash(raw_token),
      context: context,
      sent_to: sent_to,
      expires_at: expires_at
    }

    Repo.transaction(fn ->
      if Keyword.get(opts, :replace_context?, false) do
        clear_user_tokens(user.id, [context])
      end

      %UserSessionToken{}
      |> UserSessionToken.changeset(token_attrs)
      |> Repo.insert!()
    end)

    encoded_token
  end

  defp delete_token(token, context) do
    case Base.url_decode64(token, padding: false) do
      {:ok, raw_token} ->
        from(token_row in UserSessionToken,
          where: token_row.context == ^context,
          where: token_row.token_hash == ^token_hash(raw_token)
        )
        |> Repo.delete_all()

      :error ->
        :ok
    end
  end

  defp clear_user_tokens(user_id, contexts \\ :all)

  defp clear_user_tokens(user_id, :all) do
    from(token_row in UserSessionToken, where: token_row.user_id == ^user_id)
    |> Repo.delete_all()
  end

  defp clear_user_tokens(user_id, contexts) when is_list(contexts) do
    from(token_row in UserSessionToken,
      where: token_row.user_id == ^user_id,
      where: token_row.context in ^contexts
    )
    |> Repo.delete_all()
  end

  defp session_expiration do
    current_time()
    |> DateTime.add(@session_validity_in_days * 24 * 60 * 60, :second)
  end

  defp email_token_expiration(validity_in_days) do
    current_time()
    |> DateTime.add(validity_in_days * 24 * 60 * 60, :second)
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)

  defp token_hash(raw_token), do: :crypto.hash(:sha256, raw_token)
end
