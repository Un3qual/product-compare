defmodule ProductCompare.Accounts.ApiTokens.Queries do
  @moduledoc false

  @dialyzer {:nowarn_function, maybe_apply_api_token_status_filter: 3}

  import Ecto.Query

  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken

  @spec list_query(pos_integer(), keyword() | map()) :: Ecto.Query.t()
  def list_query(user_id, opts) do
    now = current_time()
    status = token_list_status_filter(opts)

    from(token in ApiToken,
      where: token.user_id == ^user_id,
      order_by: [desc: token.inserted_at, desc: token.id]
    )
    |> maybe_apply_api_token_status_filter(status, now)
  end

  @spec list(pos_integer(), keyword() | map()) :: [ApiToken.t()]
  def list(user_id, opts) do
    user_id
    |> list_query(opts)
    |> Repo.all()
  end

  @spec get_for_user(pos_integer(), binary()) :: ApiToken.t() | nil
  def get_for_user(user_id, token_entropy_id) do
    user_id
    |> get_many_for_user([token_entropy_id])
    |> Map.get(token_entropy_id)
  end

  @spec get_many_for_user(pos_integer(), [binary()]) ::
          %{optional(binary()) => ApiToken.t() | nil}
  def get_many_for_user(user_id, token_entropy_ids) do
    Input.uuid_lookup_results(token_entropy_ids, fn entropy_ids ->
      ApiToken
      |> where([token], token.user_id == ^user_id and token.entropy_id in ^entropy_ids)
      |> Repo.all()
    end)
  end

  defp token_list_status_filter(opts) when is_list(opts) do
    opts
    |> Keyword.get(:status, :all)
    |> normalize_api_token_status_filter()
  end

  defp token_list_status_filter(opts) when is_map(opts) do
    opts
    |> Input.fetch_attr(:status)
    |> normalize_api_token_status_filter()
  end

  defp token_list_status_filter(_opts), do: :all

  defp normalize_api_token_status_filter(:active), do: :active
  defp normalize_api_token_status_filter(:revoked), do: :revoked
  defp normalize_api_token_status_filter(:all), do: :all

  defp normalize_api_token_status_filter(status) when is_binary(status) do
    status
    |> String.downcase()
    |> case do
      "active" -> :active
      "revoked" -> :revoked
      "all" -> :all
      _ -> :all
    end
  end

  defp normalize_api_token_status_filter(_status), do: :all

  defp maybe_apply_api_token_status_filter(query, :all, _now), do: query

  defp maybe_apply_api_token_status_filter(query, :active, now) do
    from token in query,
      where: is_nil(token.revoked_at),
      where: is_nil(token.expires_at) or token.expires_at > ^now
  end

  defp maybe_apply_api_token_status_filter(query, :revoked, _now) do
    from token in query,
      where: not is_nil(token.revoked_at)
  end

  defp maybe_apply_api_token_status_filter(query, _status, _now), do: query

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)
end
