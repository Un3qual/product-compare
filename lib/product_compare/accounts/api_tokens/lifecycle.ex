defmodule ProductCompare.Accounts.ApiTokens.Lifecycle do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts.ApiTokens.Secrets
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken

  @accounts_config :"Elixir.ProductCompare.Accounts"
  @api_token_default_ttl_days 90

  @spec create(pos_integer(), map()) ::
          {:ok, %{plain_text_token: String.t(), api_token: ApiToken.t()}}
          | {:error, Ecto.Changeset.t()}
  def create(user_id, attrs) do
    issue_api_token(user_id, attrs, current_time())
  end

  @spec revoke(pos_integer(), Ecto.UUID.t()) ::
          {:ok, ApiToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke(user_id, token_entropy_id) do
    now = current_time()

    case Repo.transaction(fn ->
           case lock_api_token_for_rotation(user_id, token_entropy_id) do
             nil ->
               Repo.rollback(:not_found)

             %ApiToken{revoked_at: revoked_at} = token when not is_nil(revoked_at) ->
               token

             %ApiToken{} = token ->
               case revoke_api_token_record(token, now) do
                 {:ok, revoked_token} -> revoked_token
                 {:error, changeset} -> Repo.rollback(changeset)
               end
           end
         end) do
      {:ok, %ApiToken{} = token} -> {:ok, token}
      {:error, :not_found} -> {:error, :not_found}
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @spec rotate(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok,
           %{
             plain_text_token: String.t(),
             api_token: ApiToken.t(),
             revoked_api_token: ApiToken.t()
           }}
          | {:error, :not_found | Ecto.Changeset.t()}
  def rotate(user_id, token_entropy_id, attrs) do
    now = current_time()

    case Repo.transaction(fn ->
           rotate_api_token_transaction(user_id, token_entropy_id, attrs, now)
         end) do
      {:ok, result} -> {:ok, result}
      {:error, :not_found} -> {:error, :not_found}
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  defp issue_api_token(user_id, attrs, now) do
    plain_text_token = Secrets.generate()
    token_hash = Secrets.hash(plain_text_token)

    token_attrs =
      %{
        user_id: user_id,
        token_prefix: Secrets.prefix(token_hash),
        token_hash: token_hash,
        expires_at: api_token_expiry(attrs, now)
      }
      |> maybe_put(:label, Input.fetch_attr(attrs, :label))

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
    |> maybe_put(:label, Input.fetch_attr(attrs, :label) || token.label)
  end

  defp api_token_active?(%ApiToken{revoked_at: nil, expires_at: expires_at}, now) do
    is_nil(expires_at) or DateTime.compare(expires_at, now) == :gt
  end

  defp api_token_active?(_token, _now), do: false

  defp api_token_expiry(attrs, now) do
    if Input.attr_key_present?(attrs, :expires_at) do
      explicit_api_token_expiry(Input.fetch_attr(attrs, :expires_at), now)
    else
      default_api_token_expiry(now)
    end
  end

  defp explicit_api_token_expiry(nil, _now), do: nil

  defp explicit_api_token_expiry(%DateTime{} = expires_at, _now),
    do: DateTime.truncate(expires_at, :microsecond)

  defp explicit_api_token_expiry(_expires_at, now), do: default_api_token_expiry(now)

  defp default_api_token_expiry(now),
    do: DateTime.add(now, api_token_default_ttl_days() * 24 * 60 * 60, :second)

  defp ensure_map(attrs) when is_map(attrs), do: attrs
  defp ensure_map(_attrs), do: %{}

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp api_token_default_ttl_days do
    case Application.get_env(:product_compare, :api_token_default_ttl_days) do
      ttl_days when is_integer(ttl_days) and ttl_days > 0 ->
        ttl_days

      _ ->
        module_config = Application.get_env(:product_compare, @accounts_config, [])

        case Keyword.get(module_config, :api_token_default_ttl_days) do
          ttl_days when is_integer(ttl_days) and ttl_days > 0 -> ttl_days
          _ -> @api_token_default_ttl_days
        end
    end
  end

  defp current_time, do: DateTime.utc_now() |> DateTime.truncate(:microsecond)
end
