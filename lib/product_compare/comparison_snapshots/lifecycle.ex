defmodule ProductCompare.ComparisonSnapshots.Lifecycle do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.ComparisonSnapshots.Capture
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
          |> Map.new(&{&1.public_token, hydrate(&1)})
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
    {:ok, hydrate(snapshot)}
  end

  defp map_snapshot(error), do: error

  @spec hydrate(ComparisonSnapshot.t() | nil) :: ComparisonSnapshot.t() | nil
  def hydrate(nil), do: nil

  def hydrate(%ComparisonSnapshot{} = snapshot),
    do: %{snapshot | payload: decode_payload(snapshot.payload)}

  defp decode_payload(payload) do
    %{
      version: value(payload, :version),
      captured_at: value(payload, :captured_at),
      products: Enum.map(value(payload, :products, []), &decode_product/1),
      recommendation: decode_recommendation(value(payload, :recommendation, %{}))
    }
  end

  defp decode_product(product) do
    %{
      id: value(product, :id),
      name: value(product, :name),
      slug: value(product, :slug),
      description: value(product, :description),
      model_number: value(product, :model_number),
      brand_name: value(product, :brand_name),
      attributes: Enum.map(value(product, :attributes, []), &decode_attribute/1),
      offers: Enum.map(value(product, :offers, []), &decode_offer/1)
    }
  end

  defp decode_attribute(attribute) do
    Map.new(
      [:attribute_id, :claim_id, :code, :display_name, :value_text, :source_type, :confidence],
      &{&1, value(attribute, &1)}
    )
    |> Map.update!(:confidence, &decode_decimal/1)
    |> Map.put(:evidence, Enum.map(value(attribute, :evidence, []), &decode_evidence/1))
  end

  defp decode_evidence(evidence) do
    Map.new(
      [:artifact_id, :excerpt, :source_kind, :source_name, :source_domain, :url, :fetched_at],
      &{&1, value(evidence, &1)}
    )
  end

  defp decode_offer(offer) do
    Map.new(
      [
        :merchant_product_id,
        :price_point_id,
        :merchant_name,
        :merchant_domain,
        :currency,
        :item_price,
        :shipping,
        :landed_price,
        :observed_at,
        :freshness
      ],
      &{&1, value(offer, &1)}
    )
    |> Map.update!(:item_price, &decode_decimal/1)
    |> Map.update!(:shipping, &decode_decimal/1)
    |> Map.update!(:landed_price, &decode_decimal/1)
  end

  defp decode_recommendation(recommendation) do
    Map.new(
      [
        :profile,
        :algorithm_version,
        :evaluated_at,
        :status,
        :winner_product_id,
        :currency,
        :missing_inputs
      ],
      &{&1, value(recommendation, &1)}
    )
    |> Map.update!(:profile, &decode_recommendation_profile/1)
    |> Map.update!(:evaluated_at, &decode_datetime/1)
    |> Map.update!(:status, &decode_recommendation_status/1)
    |> Map.put(:rankings, Enum.map(value(recommendation, :rankings, []), &decode_ranking/1))
  end

  defp decode_ranking(ranking) do
    Map.new(
      [
        :rank,
        :product_id,
        :product_name,
        :landed_price,
        :currency,
        :price_point_id,
        :merchant_product_id,
        :claim_ids,
        :reasons
      ],
      &{&1, value(ranking, &1)}
    )
    |> Map.update!(:landed_price, &decode_decimal/1)
  end

  defp decode_decimal(nil), do: nil
  defp decode_decimal(%Decimal{} = value), do: value
  defp decode_decimal(value) when is_binary(value), do: Decimal.new(value)

  defp decode_datetime(%DateTime{} = value), do: value

  defp decode_datetime(value) when is_binary(value) do
    {:ok, datetime, _offset} = DateTime.from_iso8601(value)
    datetime
  end

  defp decode_recommendation_profile(:lowest_current_cost), do: :lowest_current_cost
  defp decode_recommendation_profile(:best_value), do: :best_value
  defp decode_recommendation_profile("lowest_current_cost"), do: :lowest_current_cost
  defp decode_recommendation_profile("best_value"), do: :best_value

  defp decode_recommendation_status(:winner), do: :winner
  defp decode_recommendation_status(:tie), do: :tie
  defp decode_recommendation_status(:insufficient_evidence), do: :insufficient_evidence
  defp decode_recommendation_status("winner"), do: :winner
  defp decode_recommendation_status("tie"), do: :tie
  defp decode_recommendation_status("insufficient_evidence"), do: :insufficient_evidence

  defp value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
