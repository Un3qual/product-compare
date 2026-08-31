defmodule ProductCompare.Accounts.UserAuth.EmailTokens do
  @moduledoc false

  import Ecto.Query
  require Logger

  alias ProductCompare.Accounts.UserAuth.Sessions
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @before_reset_user_password_transaction_hook :before_reset_user_password_transaction
  @confirm_context :confirm
  @confirm_validity_in_days 7
  @reset_password_context :reset_password
  @reset_password_validity_in_days 1
  @user_auth_config :"Elixir.ProductCompare.Accounts.UserAuth"

  @spec deliver_confirmation_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_confirmation_instructions(%User{} = user, delivery_fun) do
    deliver_user_email_instructions(
      user,
      @confirm_context,
      email_token_expiration(@confirm_validity_in_days),
      delivery_fun
    )
  end

  @spec confirm_user(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  def confirm_user(token) when is_binary(token) do
    with {:ok, raw_token} <- Sessions.decode(token) do
      case Repo.transaction(fn ->
             case consume_user_email_token(raw_token, @confirm_context) do
               %User{} = user ->
                 confirmed_user =
                   user
                   |> User.confirm_changeset()
                   |> Repo.update!()

                 Sessions.clear(user.id, [@confirm_context])
                 confirmed_user

               nil ->
                 Repo.rollback(:invalid_token)
             end
           end) do
        {:ok, %User{} = confirmed_user} -> {:ok, confirmed_user}
        {:error, :invalid_token} -> {:error, :invalid_token}
      end
    else
      :error -> {:error, :invalid_token}
    end
  end

  def confirm_user(_token), do: {:error, :invalid_token}

  @spec deliver_reset_password_instructions(User.t(), (String.t() -> any())) :: :ok
  def deliver_reset_password_instructions(%User{} = user, delivery_fun) do
    deliver_user_email_instructions(
      user,
      @reset_password_context,
      email_token_expiration(@reset_password_validity_in_days),
      delivery_fun
    )
  end

  @spec get_user_by_reset_password_token(String.t()) :: User.t() | nil
  def get_user_by_reset_password_token(token) when is_binary(token) do
    with {:ok, raw_token} <- Sessions.decode(token) do
      now = Sessions.current_time()

      from(token_row in UserSessionToken,
        join: user in assoc(token_row, :user),
        where: token_row.context == ^@reset_password_context,
        where: token_row.token_hash == ^Sessions.hash(raw_token),
        where: token_row.expires_at > ^now,
        where: token_row.sent_to == user.email,
        select: user
      )
      |> Repo.one()
    else
      :error -> nil
    end
  end

  def get_user_by_reset_password_token(_token), do: nil

  @spec reset_user_password(String.t(), map()) ::
          {:ok, User.t()} | {:error, :invalid_token | Ecto.Changeset.t()}
  def reset_user_password(token, attrs) when is_binary(token) and is_map(attrs) do
    with {:ok, raw_token} <- Sessions.decode(token) do
      run_test_hook(@before_reset_user_password_transaction_hook)

      case Repo.transaction(fn ->
             case consume_user_email_token(raw_token, @reset_password_context) do
               %User{} = user ->
                 case user
                      |> User.password_changeset(attrs)
                      |> Repo.update() do
                   {:ok, updated_user} ->
                     Sessions.clear(user.id, :all)
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

  defp email_token_expiration(validity_in_days) do
    Sessions.current_time()
    |> DateTime.add(validity_in_days * 24 * 60 * 60, :second)
  end

  defp consume_user_email_token(raw_token, context) do
    now = Sessions.current_time()

    case Repo.one(
           from token_row in UserSessionToken,
             join: user in assoc(token_row, :user),
             where: token_row.context == ^context,
             where: token_row.token_hash == ^Sessions.hash(raw_token),
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

  defp deliver_user_email_instructions(%User{} = user, context, expires_at, delivery_fun) do
    token = Sessions.issue(user, context, expires_at, sent_to: user.email)

    case invoke_delivery_fun(delivery_fun, token) do
      :ok ->
        case Sessions.activate_context_token(user.id, context, token) do
          :ok ->
            :ok

          {:error, :invalid_token} ->
            Logger.warning("delivered #{context} token was superseded before activation")
            :ok
        end

      {:error, reason} ->
        :ok = Sessions.discard_context_token(token, context)

        Logger.warning(
          "delivery hook failed for #{context} token " <>
            "(delivery_error=#{delivery_failure_kind(reason)})"
        )

        :ok
    end
  end

  defp invoke_delivery_fun(delivery_fun, token) do
    try do
      case delivery_fun.(token) do
        :error -> {:error, :error}
        {:error, reason} -> {:error, reason}
        _other -> :ok
      end
    rescue
      error -> {:error, {:raised, error, __STACKTRACE__}}
    catch
      kind, reason -> {:error, {:caught, kind, reason}}
    end
  end

  defp delivery_failure_kind({:raised, error, _stacktrace}) when is_exception(error) do
    error.__struct__
    |> Module.split()
    |> List.last()
  end

  defp delivery_failure_kind({:caught, kind, _reason}), do: to_string(kind)
  defp delivery_failure_kind(_reason), do: "returned_error"

  defp run_test_hook(hook_key) do
    case Application.get_env(:product_compare, @user_auth_config, [])
         |> Keyword.get(hook_key) do
      fun when is_function(fun, 0) -> fun.()
      _other -> :ok
    end
  end
end
