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
    attrs = ensure_hashed_password(attrs)

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
    now = current_time()
    issue_api_token(user_id, attrs, now)
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

  @spec list_api_tokens_query(pos_integer(), keyword() | map()) :: Ecto.Query.t()
  def list_api_tokens_query(user_id, opts \\ []) do
    now = current_time()
    status = token_list_status_filter(opts)

    from(token in ApiToken,
      where: token.user_id == ^user_id,
      order_by: [desc: token.inserted_at, desc: token.id]
    )
    |> maybe_apply_api_token_status_filter(status, now)
  end

  @spec list_api_tokens(pos_integer(), keyword() | map()) :: [ApiToken.t()]
  def list_api_tokens(user_id, opts \\ []) do
    user_id
    |> list_api_tokens_query(opts)
    |> Repo.all()
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
        now = current_time()

        revoke_api_token_record(token, now)
    end
  end

  def revoke_api_token(_user_id, _token_entropy_id), do: {:error, :not_found}

  @spec rotate_api_token(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok,
           %{
             plain_text_token: String.t(),
             api_token: ApiToken.t(),
             revoked_api_token: ApiToken.t()
           }}
          | {:error, :not_found | Ecto.Changeset.t()}
  def rotate_api_token(user_id, token_entropy_id, attrs \\ %{})

  def rotate_api_token(user_id, token_entropy_id, attrs) when is_binary(token_entropy_id) do
    now = current_time()

    case Repo.transaction(fn ->
           rotate_api_token_transaction(user_id, token_entropy_id, attrs, now)
         end) do
      {:ok, result} ->
        {:ok, result}

      {:error, :not_found} ->
        {:error, :not_found}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, changeset}
    end
  end

  def rotate_api_token(_user_id, _token_entropy_id, _attrs), do: {:error, :not_found}

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

  # Accounts currently authenticate via API tokens. For user rows created
  # without password input, generate a random 256-bit hex placeholder so
  # `hashed_password` remains non-null and non-predictable.
  defp ensure_hashed_password(attrs) when is_map(attrs) do
    case Map.get(attrs, :hashed_password, Map.get(attrs, "hashed_password")) do
      hashed_password when is_binary(hashed_password) and hashed_password != "" ->
        attrs

      _ ->
        put_default_hashed_password(attrs)
    end
  end

  defp ensure_hashed_password(_attrs), do: %{hashed_password: default_hashed_password()}

  defp put_default_hashed_password(attrs) do
    if Enum.any?(Map.keys(attrs), &is_binary/1) do
      Map.put(attrs, "hashed_password", default_hashed_password())
    else
      Map.put(attrs, :hashed_password, default_hashed_password())
    end
  end

  defp default_hashed_password do
    :crypto.strong_rand_bytes(32)
    |> Base.encode16(case: :lower)
  end

  defp maybe_touch_api_token(token_id, now, opts) do
    if Keyword.get(opts, :touch_last_used?, true) do
      from(token in ApiToken, where: token.id == ^token_id)
      |> Repo.update_all(set: [last_used_at: now])
    end

    :ok
  end

  defp issue_api_token(user_id, attrs, now) do
    plain_text_token = generate_api_token_secret()
    token_hash = hash_api_token_secret(plain_text_token)

    token_attrs =
      %{
        user_id: user_id,
        token_prefix: token_prefix_from_hash(token_hash),
        token_hash: token_hash,
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

  defp rotate_api_token_transaction(user_id, token_entropy_id, attrs, now) do
    case lock_api_token_for_rotation(user_id, token_entropy_id) do
      nil ->
        Repo.rollback(:not_found)

      %ApiToken{} = token ->
        if api_token_active?(token, now) do
          with {:ok, revoked_token} <- revoke_api_token_record(token, now),
               {:ok, replacement} <-
                 issue_api_token(user_id, merge_rotation_defaults(attrs, token), now) do
            Map.put(replacement, :revoked_api_token, revoked_token)
          else
            {:error, %Ecto.Changeset{} = changeset} ->
              Repo.rollback(changeset)
          end
        else
          Repo.rollback(:not_found)
        end
    end
  end

  defp lock_api_token_for_rotation(user_id, token_entropy_id) do
    from(token in ApiToken,
      where: token.user_id == ^user_id and token.entropy_id == ^token_entropy_id,
      lock: "FOR UPDATE"
    )
    |> Repo.one()
  end

  defp revoke_api_token_record(token, now) do
    token
    |> Ecto.Changeset.change(revoked_at: now)
    |> Repo.update()
  end

  defp merge_rotation_defaults(attrs, token) do
    attrs
    |> ensure_map()
    |> maybe_put(:label, fetch_attr(attrs, :label) || token.label)
  end

  defp api_token_active?(%ApiToken{revoked_at: nil, expires_at: expires_at}, now) do
    is_nil(expires_at) or DateTime.compare(expires_at, now) == :gt
  end

  defp api_token_active?(_token, _now), do: false

  defp token_list_status_filter(opts) when is_list(opts) do
    opts
    |> Keyword.get(:status, :all)
    |> normalize_api_token_status_filter()
  end

  defp token_list_status_filter(opts) when is_map(opts) do
    opts
    |> fetch_attr(:status)
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

  defp default_api_token_expiry(%DateTime{} = expires_at, _now),
    do: DateTime.truncate(expires_at, :microsecond)

  defp default_api_token_expiry(_expires_at, now),
    do: DateTime.add(now, api_token_default_ttl_days() * 24 * 60 * 60, :second)

  defp api_token_default_ttl_days do
    case Application.get_env(:product_compare, :api_token_default_ttl_days) do
      ttl_days when is_integer(ttl_days) and ttl_days > 0 ->
        ttl_days

      _ ->
        module_config = Application.get_env(:product_compare, __MODULE__, [])

        case Keyword.get(module_config, :api_token_default_ttl_days) do
          ttl_days when is_integer(ttl_days) and ttl_days > 0 -> ttl_days
          _ -> @api_token_default_ttl_days
        end
    end
  end

  defp fetch_attr(attrs, key) when is_map(attrs) do
    Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
  end

  defp fetch_attr(_attrs, _key), do: nil

  defp ensure_map(attrs) when is_map(attrs), do: attrs
  defp ensure_map(_attrs), do: %{}

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp hash_api_token_secret(plain_text_token), do: :crypto.hash(:sha3_256, plain_text_token)

  defp token_prefix_from_hash(token_hash) do
    token_hash
    |> Base.encode16(case: :lower)
    |> binary_part(0, @api_token_prefix_length)
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)

  defp generate_api_token_secret do
    @api_token_secret_bytes
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end
end
