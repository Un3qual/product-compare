defmodule ProductCompare.Accounts.UserAuth do
  @moduledoc """
  User authentication helpers for password-backed login and token issuance.

  Session token creation re-checks the current password hash under a row lock so
  auth state captured before a password reset cannot mint a fresh session after
  the reset commits. Tests may also install zero-arity hooks in
  `Application.get_env(:product_compare, __MODULE__)` to pause specific
  concurrency windows deterministically.
  """

  import Ecto.Query
  require Logger

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @before_reset_user_password_transaction_hook :before_reset_user_password_transaction
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

  @spec generate_user_session_token(User.t()) :: String.t() | nil
  def generate_user_session_token(%User{} = user) do
    case Repo.transaction(fn ->
           case lock_user_for_session_issue(user.id) do
             %User{} = current_user ->
               if current_user.hashed_password == user.hashed_password do
                 insert_user_token!(current_user, @session_context, session_expiration())
               else
                 Repo.rollback(:stale_authentication)
               end

             nil ->
               Repo.rollback(:stale_authentication)
           end
         end) do
      {:ok, encoded_token} -> encoded_token
      {:error, :stale_authentication} -> nil
    end
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
    deliver_user_email_instructions(
      user,
      @confirm_context,
      email_token_expiration(@confirm_validity_in_days),
      delivery_fun
    )
  end

  @spec confirm_user(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  def confirm_user(token) when is_binary(token) do
    with {:ok, raw_token} <- decode_token(token) do
      case Repo.transaction(fn ->
             case consume_user_email_token(raw_token, @confirm_context) do
               %User{} = user ->
                 # Confirmation only persists `confirmed_at` on an existing row, so
                 # this path cannot produce user-validation errors.
                 confirmed_user =
                   user
                   |> User.confirm_changeset()
                   |> Repo.update!()

                 clear_user_tokens(user.id, [@confirm_context])
                 confirmed_user

               nil ->
                 Repo.rollback(:invalid_token)
             end
           end) do
        {:ok, confirmed_user} -> {:ok, confirmed_user}
        {:error, :invalid_token} -> {:error, :invalid_token}
      end
    else
      :error -> {:error, :invalid_token}
    end
  end

  def confirm_user(_token), do: {:error, :invalid_token}

  @spec deliver_user_reset_password_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_user_reset_password_instructions(%User{} = user, delivery_fun)
      when is_function(delivery_fun, 1) do
    deliver_user_email_instructions(
      user,
      @reset_password_context,
      email_token_expiration(@reset_password_validity_in_days),
      delivery_fun
    )
  end

  @spec get_user_by_reset_password_token(String.t()) :: User.t() | nil
  def get_user_by_reset_password_token(token) when is_binary(token) do
    get_user_by_email_token(token, @reset_password_context)
  end

  def get_user_by_reset_password_token(_token), do: nil

  @spec reset_user_password(String.t(), map()) ::
          {:ok, User.t()} | {:error, :invalid_token | Ecto.Changeset.t()}
  def reset_user_password(token, attrs) when is_binary(token) and is_map(attrs) do
    with {:ok, raw_token} <- decode_token(token) do
      run_test_hook(@before_reset_user_password_transaction_hook)

      case Repo.transaction(fn ->
             case consume_user_email_token(raw_token, @reset_password_context) do
               %User{} = user ->
                 case user
                      |> User.password_changeset(attrs)
                      |> Repo.update() do
                   {:ok, updated_user} ->
                     clear_user_tokens(user.id)
                     updated_user

                   {:error, %Ecto.Changeset{} = changeset} ->
                     Repo.rollback(changeset)
                 end

               nil ->
                 Repo.rollback(:invalid_token)
             end
           end) do
        {:ok, updated_user} -> {:ok, updated_user}
        {:error, :invalid_token} -> {:error, :invalid_token}
        {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
      end
    else
      :error -> {:error, :invalid_token}
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
    with {:ok, raw_token} <- decode_token(token) do
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
    with {:ok, raw_token} <- decode_token(token) do
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

  defp issue_user_token_in_transaction(%User{} = user, context, expires_at, opts) do
    if Keyword.get(opts, :replace_context?, false) do
      clear_user_tokens(user.id, [context])
    end

    insert_user_token!(user, context, expires_at, opts)
  end

  defp insert_user_token!(%User{} = user, context, expires_at, opts \\ []) do
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

    %UserSessionToken{}
    |> UserSessionToken.changeset(token_attrs)
    |> Repo.insert!()

    encoded_token
  end

  defp delete_token(token, context) do
    case decode_token(token) do
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

  defp consume_user_email_token(raw_token, context) do
    now = current_time()

    case Repo.one(
           from token_row in UserSessionToken,
             join: user in assoc(token_row, :user),
             where: token_row.context == ^context,
             where: token_row.token_hash == ^token_hash(raw_token),
             where: token_row.expires_at > ^now,
             where: token_row.sent_to == user.email,
             lock: "FOR UPDATE",
             select: {token_row, user}
         ) do
      {%UserSessionToken{} = token_row, %User{} = user} ->
        Repo.delete!(token_row)
        user

      nil ->
        nil
    end
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)

  defp decode_token(token), do: Base.url_decode64(token, padding: false)

  defp lock_user_for_session_issue(user_id) do
    Repo.one(
      from user in User,
        where: user.id == ^user_id,
        lock: "FOR UPDATE"
    )
  end

  # Run the transport hook before commit so replace-context delivery failures
  # roll back to the previously valid token instead of stranding the user.
  defp deliver_user_email_instructions(%User{} = user, context, expires_at, delivery_fun) do
    case Repo.transaction(fn ->
           token =
             issue_user_token_in_transaction(
               user,
               context,
               expires_at,
               sent_to: user.email,
               replace_context?: true
             )

           case invoke_delivery_fun(delivery_fun, token) do
             :ok -> :ok
             {:error, reason} -> Repo.rollback({:delivery_failed, context, reason})
           end
         end) do
      {:ok, :ok} ->
        :ok

      {:error, {:delivery_failed, failed_context, reason}} ->
        Logger.warning(
          "delivery hook failed for #{failed_context} token: #{format_delivery_failure(reason)}"
        )

        :ok
    end
  end

  defp invoke_delivery_fun(delivery_fun, token) do
    try do
      case delivery_fun.(token) do
        {:error, reason} -> {:error, reason}
        _other -> :ok
      end
    rescue
      error -> {:error, {:raised, error, __STACKTRACE__}}
    catch
      kind, reason -> {:error, {:caught, kind, reason}}
    end
  end

  defp format_delivery_failure({:raised, error, _stacktrace}) when is_exception(error) do
    Exception.message(error)
  end

  defp format_delivery_failure({:caught, kind, reason}) do
    "#{kind}: #{inspect(reason)}"
  end

  defp format_delivery_failure(reason), do: inspect(reason)

  # Test-only hook for deterministically pausing callers before the reset
  # password transaction races to consume a single-use token.
  defp run_test_hook(hook_key) do
    case Application.get_env(:product_compare, __MODULE__, [])
         |> Keyword.get(hook_key) do
      fun when is_function(fun, 0) -> fun.()
      _other -> :ok
    end
  end

  defp token_hash(raw_token), do: :crypto.hash(:sha256, raw_token)
end
