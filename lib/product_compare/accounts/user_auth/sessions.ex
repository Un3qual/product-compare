defmodule ProductCompare.Accounts.UserAuth.Sessions do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @session_context :session
  @session_validity_in_days 60
  @token_bytes 32

  @spec generate_user_session_token(User.t()) :: String.t() | nil
  def generate_user_session_token(%User{} = user) do
    case Repo.transaction(fn ->
           case lock_user_for_session_issue(user.id) do
             %User{} = current_user ->
               if current_user.hashed_password == user.hashed_password do
                 issue(current_user, @session_context, session_expiration(), [])
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
    with {:ok, raw_token} <- decode(token) do
      now = current_time()

      from(token_row in UserSessionToken,
        join: user in assoc(token_row, :user),
        where: token_row.context == ^@session_context,
        where: token_row.token_hash == ^hash(raw_token),
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
    delete_token(token, @session_context)
    :ok
  end

  def delete_user_session_token(_token), do: :ok

  @spec issue(User.t(), atom(), DateTime.t(), keyword()) :: String.t()
  def issue(%User{} = user, context, expires_at, opts) do
    if Keyword.get(opts, :replace_context?, false) do
      clear(user.id, [context])
    end

    raw_token = :crypto.strong_rand_bytes(@token_bytes)
    encoded_token = Base.url_encode64(raw_token, padding: false)

    token_attrs = %{
      user_id: user.id,
      token_hash: hash(raw_token),
      context: context,
      sent_to: Keyword.get(opts, :sent_to),
      expires_at: expires_at
    }

    %UserSessionToken{}
    |> UserSessionToken.changeset(token_attrs)
    |> Repo.insert!()

    encoded_token
  end

  @spec decode(String.t()) :: {:ok, binary()} | :error
  def decode(token), do: Base.url_decode64(token, padding: false)

  @spec hash(binary()) :: binary()
  def hash(raw_token), do: :crypto.hash(:sha256, raw_token)

  @spec clear(pos_integer(), :all | [atom()]) :: {non_neg_integer(), nil}
  def clear(user_id, :all) do
    from(token_row in UserSessionToken, where: token_row.user_id == ^user_id)
    |> Repo.delete_all()
  end

  def clear(user_id, contexts) when is_list(contexts) do
    from(token_row in UserSessionToken,
      where: token_row.user_id == ^user_id,
      where: token_row.context in ^contexts
    )
    |> Repo.delete_all()
  end

  @spec current_time() :: DateTime.t()
  def current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)

  defp delete_token(token, context) do
    case decode(token) do
      {:ok, raw_token} ->
        from(token_row in UserSessionToken,
          where: token_row.context == ^context,
          where: token_row.token_hash == ^hash(raw_token)
        )
        |> Repo.delete_all()

      :error ->
        :ok
    end
  end

  defp session_expiration do
    current_time()
    |> DateTime.add(@session_validity_in_days * 24 * 60 * 60, :second)
  end

  defp lock_user_for_session_issue(user_id) do
    Repo.one(
      from user in User,
        where: user.id == ^user_id,
        lock: "FOR UPDATE"
    )
  end
end
