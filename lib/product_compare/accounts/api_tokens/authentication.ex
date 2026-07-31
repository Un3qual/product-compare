defmodule ProductCompare.Accounts.ApiTokens.Authentication do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts.ApiTokens.Secrets
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User

  @spec authenticate(any(), keyword()) :: {:ok, User.t(), ApiToken.t()} | :error
  def authenticate("", _opts), do: :error
  def authenticate(plain_text_token, _opts) when not is_binary(plain_text_token), do: :error

  def authenticate(plain_text_token, opts) do
    now = current_time()
    token_hash = Secrets.hash(plain_text_token)

    query =
      from token in ApiToken,
        join: user in assoc(token, :user),
        where: token.token_hash == ^token_hash,
        where: is_nil(token.revoked_at),
        where: is_nil(token.expires_at) or token.expires_at > ^now,
        select: {user, token}

    case Repo.one(query) do
      {user, token} ->
        if touch_api_token_if_active(token.id, now, opts) do
          {:ok, user, %{token | last_used_at: now}}
        else
          :error
        end

      nil ->
        :error
    end
  end

  defp touch_api_token_if_active(token_id, now, opts) do
    if Keyword.get(opts, :touch_last_used?, true) do
      {count, _rows} =
        ApiToken
        |> where([token], token.id == ^token_id)
        |> where([token], is_nil(token.revoked_at))
        |> where([token], is_nil(token.expires_at) or token.expires_at > ^now)
        |> Repo.update_all(set: [last_used_at: now])

      count == 1
    else
      true
    end
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)
end
