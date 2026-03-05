defmodule ProductCompare.Accounts do
  @moduledoc """
  Accounts context for users and reputation events.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.ReputationEvent
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

  @api_token_default_ttl_days 90
  @api_token_prefix_length 12
  @api_token_secret_bytes 32
  @default_reputation_events_limit 50
  @max_reputation_events_limit 200

  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @spec get_user!(pos_integer()) :: User.t()
  def get_user!(id), do: Repo.get!(User, id)

  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email), do: Repo.get_by(User, email: String.downcase(email))

  @spec create_api_token(pos_integer(), map()) ::
          {:ok, %{plain_text_token: String.t(), api_token: ApiToken.t()}}
          | {:error, Ecto.Changeset.t()}
  def create_api_token(user_id, attrs \\ %{}) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
    plain_text_token = generate_api_token_secret()

    token_attrs =
      %{
        user_id: user_id,
        token_prefix: String.slice(plain_text_token, 0, @api_token_prefix_length),
        token_hash: hash_api_token_secret(plain_text_token),
        expires_at: default_api_token_expiry(fetch_attr(attrs, :expires_at), now)
      }
      |> maybe_put(:label, fetch_attr(attrs, :label))

    case %ApiToken{}
         |> ApiToken.changeset(token_attrs)
         |> Repo.insert(returning: true) do
      {:ok, api_token} ->
        {:ok, %{plain_text_token: plain_text_token, api_token: api_token}}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @spec authenticate_api_token(String.t(), keyword()) :: {:ok, User.t(), ApiToken.t()} | :error
  def authenticate_api_token(plain_text_token, opts \\ [])

  def authenticate_api_token(plain_text_token, _opts)
      when not is_binary(plain_text_token) or plain_text_token == "" do
    :error
  end

  def authenticate_api_token(plain_text_token, opts) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
    token_hash = hash_api_token_secret(plain_text_token)

    query =
      from token in ApiToken,
        join: user in assoc(token, :user),
        where: token.token_hash == ^token_hash,
        where: is_nil(token.revoked_at),
        where: is_nil(token.expires_at) or token.expires_at > ^now,
        select: {user, token}

    case Repo.one(query) do
      {user, token} ->
        maybe_touch_api_token(token.id, now, opts)
        {:ok, user, token}

      nil ->
        :error
    end
  end

  @spec list_api_tokens(pos_integer()) :: [ApiToken.t()]
  def list_api_tokens(user_id) do
    Repo.all(
      from token in ApiToken,
        where: token.user_id == ^user_id,
        order_by: [desc: token.inserted_at, desc: token.id]
    )
  end

  @spec revoke_api_token(pos_integer(), Ecto.UUID.t()) ::
          {:ok, ApiToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke_api_token(user_id, token_entropy_id) when is_binary(token_entropy_id) do
    case Repo.get_by(ApiToken, user_id: user_id, entropy_id: token_entropy_id) do
      nil ->
        {:error, :not_found}

      %ApiToken{revoked_at: revoked_at} = token when not is_nil(revoked_at) ->
        {:ok, token}

      %ApiToken{} = token ->
        now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

        token
        |> Ecto.Changeset.change(revoked_at: now)
        |> Repo.update()
    end
  end

  def revoke_api_token(_user_id, _token_entropy_id), do: {:error, :not_found}

  @spec upsert_user_reputation(pos_integer(), integer()) ::
          {:ok, UserReputation.t()} | {:error, Ecto.Changeset.t()}
  def upsert_user_reputation(user_id, points) do
    %UserReputation{}
    |> UserReputation.changeset(%{user_id: user_id, points: points})
    |> Repo.insert(
      on_conflict: [set: [points: points]],
      conflict_target: [:user_id],
      returning: true
    )
  end

  @spec add_reputation_event(pos_integer(), map()) ::
          {:ok, ReputationEvent.t()} | {:error, Ecto.Changeset.t()}
  def add_reputation_event(user_id, attrs) do
    %ReputationEvent{}
    |> ReputationEvent.changeset_with_user(attrs, user_id)
    |> Repo.insert()
  end

  @spec list_reputation_events(pos_integer(), keyword() | map()) :: [ReputationEvent.t()]
  def list_reputation_events(user_id, opts \\ []) do
    limit =
      opts
      |> get_pagination_value(:limit, @default_reputation_events_limit)
      |> clamp_limit(@default_reputation_events_limit, @max_reputation_events_limit)

    offset =
      opts
      |> get_pagination_value(:offset, 0)
      |> clamp_non_negative(0)

    Repo.all(
      from e in ReputationEvent,
        where: e.user_id == ^user_id,
        order_by: [desc: e.inserted_at, desc: e.id],
        limit: ^limit,
        offset: ^offset
    )
  end

  defp get_pagination_value(opts, key, default) when is_list(opts) do
    opts
    |> Keyword.get(key, default)
    |> parse_pagination_value(default)
  end

  defp get_pagination_value(opts, key, default) when is_map(opts) do
    opts
    |> Map.get(key, Map.get(opts, Atom.to_string(key), default))
    |> parse_pagination_value(default)
  end

  defp get_pagination_value(_opts, _key, default), do: default

  defp parse_pagination_value(value, _default) when is_integer(value), do: value

  defp parse_pagination_value(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> parsed
      _ -> default
    end
  end

  defp parse_pagination_value(_value, default), do: default

  defp clamp_limit(value, _default, max) when is_integer(value) and value > 0, do: min(value, max)
  defp clamp_limit(_value, default, _max), do: default

  defp clamp_non_negative(value, _default) when is_integer(value) and value >= 0, do: value
  defp clamp_non_negative(_value, default), do: default

  defp maybe_touch_api_token(token_id, now, opts) do
    if Keyword.get(opts, :touch_last_used?, true) do
      from(token in ApiToken, where: token.id == ^token_id)
      |> Repo.update_all(set: [last_used_at: now])
    end

    :ok
  end

  defp default_api_token_expiry(%DateTime{} = expires_at, _now),
    do: DateTime.truncate(expires_at, :microsecond)

  defp default_api_token_expiry(_expires_at, now),
    do: DateTime.add(now, @api_token_default_ttl_days * 24 * 60 * 60, :second)

  defp fetch_attr(attrs, key) when is_map(attrs) do
    Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
  end

  defp fetch_attr(_attrs, _key), do: nil

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp hash_api_token_secret(plain_text_token), do: :crypto.hash(:sha3_256, plain_text_token)

  defp generate_api_token_secret do
    @api_token_secret_bytes
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end
end
