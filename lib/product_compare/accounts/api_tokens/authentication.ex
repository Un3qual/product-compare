defmodule ProductCompare.Accounts.ApiTokens.Authentication do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts.ApiTokens.Secrets
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User

  @spec authenticate(any()) :: {:ok, User.t(), ApiToken.t()} | :error
  def authenticate(""), do: :error
  def authenticate(plain_text_token) when not is_binary(plain_text_token), do: :error

  def authenticate(plain_text_token) do
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
        case touch_api_token_if_active(token.id, now) do
          :touched -> {:ok, user, %{token | last_used_at: now}}
          :inactive -> :error
        end

      nil ->
        :error
    end
  end

  defp touch_api_token_if_active(token_id, now) do
    {count, _rows} =
      ApiToken
      |> where([token], token.id == ^token_id)
      |> where([token], is_nil(token.revoked_at))
      |> where([token], is_nil(token.expires_at) or token.expires_at > ^now)
      |> Repo.update_all(set: [last_used_at: now])

    if count == 1, do: :touched, else: :inactive
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)
end
