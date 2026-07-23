defmodule ProductCompare.ComparisonSnapshots.Lifecycle do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.ComparisonSnapshots.Capture
  alias ProductCompare.ComparisonSnapshots.PayloadCodec
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  @profiles [:lowest_current_cost, :best_value]
  @public_token_pattern ~r/^[A-Za-z0-9_-]{43}$/

  @spec publish(pos_integer(), map(), keyword()) ::
          {:ok, ComparisonSnapshot.t()}
          | {:error,
             :invalid_products | :product_not_found | :invalid_profile | Ecto.Changeset.t()}
  def publish(user_id, attrs, opts \\ []) when is_integer(user_id) and is_map(attrs) do
    product_ids = Input.fetch_attr(attrs, :product_ids) || []
    profile = Input.fetch_attr(attrs, :recommendation_profile) || :lowest_current_cost
    now = Keyword.get(opts, :now, DateTime.utc_now()) |> DateTime.truncate(:microsecond)

    with :ok <- validate_product_ids(product_ids),
         :ok <- validate_profile(profile),
         {:ok, products} <- Capture.load_products(product_ids) do
      payload = Capture.capture(products, profile, now)

      %ComparisonSnapshot{}
      |> ComparisonSnapshot.publish_changeset(%{
        public_token: public_token(),
        user_id: user_id,
        title: normalize_title(Input.fetch_attr(attrs, :title)),
        search_indexable: Input.fetch_attr(attrs, :search_indexable) || false,
        payload: payload
      })
      |> Ecto.Changeset.put_change(:search_qualified, Seo.snapshot_qualified?(payload))
      |> Repo.insert()
      |> map_snapshot()
    end
  end

  @spec get_public(String.t()) :: ComparisonSnapshot.t() | nil
  def get_public(token) when is_binary(token) do
    [token]
    |> get_public_many()
    |> Map.get(token)
  end

  @spec get_public_many([term()]) :: %{optional(String.t()) => ComparisonSnapshot.t() | nil}
  def get_public_many(tokens) when is_list(tokens) do
    tokens =
      tokens
      |> Enum.filter(&(is_binary(&1) and Regex.match?(@public_token_pattern, &1)))
      |> Enum.uniq()

    snapshots =
      case tokens do
        [] ->
          %{}

        _ ->
          ComparisonSnapshot
          |> where(
            [snapshot],
            snapshot.public_token in ^tokens and is_nil(snapshot.revoked_at)
          )
          |> Repo.all()
          |> Map.new(&{&1.public_token, PayloadCodec.hydrate(&1)})
      end

    Map.new(tokens, &{&1, Map.get(snapshots, &1)})
  end

  @spec active_for_owner_query(pos_integer()) :: Ecto.Query.t()
  def active_for_owner_query(user_id) when is_integer(user_id) do
    ComparisonSnapshot
    |> where([snapshot], snapshot.user_id == ^user_id and is_nil(snapshot.revoked_at))
    |> order_by([snapshot], desc: snapshot.inserted_at, desc: snapshot.id)
  end

  @spec revoke(pos_integer(), Ecto.UUID.t(), keyword()) ::
          {:ok, ComparisonSnapshot.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke(user_id, entropy_id, opts \\ [])

  def revoke(user_id, entropy_id, opts)
      when is_integer(user_id) and is_binary(entropy_id) do
    now = Keyword.get(opts, :now, DateTime.utc_now()) |> DateTime.truncate(:microsecond)

    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id),
         %ComparisonSnapshot{} = snapshot <-
           Repo.one(
             from snapshot in ComparisonSnapshot,
               where:
                 snapshot.user_id == ^user_id and snapshot.entropy_id == ^uuid and
                   is_nil(snapshot.revoked_at)
           ) do
      snapshot
      |> ComparisonSnapshot.revoke_changeset(now)
      |> Repo.update(stale_error_field: :id)
      |> map_snapshot()
    else
      _ -> {:error, :not_found}
    end
  end

  defp validate_product_ids(product_ids) do
    if is_list(product_ids) and length(product_ids) in 2..3 and
         Enum.all?(product_ids, &(is_integer(&1) and &1 > 0)) and
         length(Enum.uniq(product_ids)) == length(product_ids) do
      :ok
    else
      {:error, :invalid_products}
    end
  end

  defp validate_profile(profile) when profile in @profiles, do: :ok
  defp validate_profile(_profile), do: {:error, :invalid_profile}

  defp normalize_title(nil), do: nil
  defp normalize_title(title) when is_binary(title), do: String.trim(title)
  defp normalize_title(_title), do: nil

  defp public_token, do: 32 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)

  defp map_snapshot({:ok, snapshot}) do
    snapshot = Repo.get!(ComparisonSnapshot, snapshot.id)
    {:ok, PayloadCodec.hydrate(snapshot)}
  end

  defp map_snapshot(error), do: error

  @spec hydrate(ComparisonSnapshot.t() | nil) :: ComparisonSnapshot.t() | nil
  def hydrate(nil), do: PayloadCodec.hydrate(nil)

  def hydrate(%ComparisonSnapshot{} = snapshot),
    do: PayloadCodec.hydrate(snapshot)
end
