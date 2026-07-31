defmodule ProductCompare.ComparisonSnapshots.Lifecycle do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.ComparisonSnapshots.Capture
  alias ProductCompare.Input
  alias ProductCompare.Repo
  alias ProductCompare.Seo
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.{
    Attribute,
    Evidence,
    Offer,
    Product,
    Ranking,
    Recommendation
  }

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
         :ok <- validate_profile(profile) do
      repeatable_read_transaction(fn ->
        with {:ok, products} <- Capture.load_products(product_ids) do
          facts = Capture.capture(products, profile, now)

          snapshot =
            %ComparisonSnapshot{}
            |> ComparisonSnapshot.publish_changeset(%{
              public_token: public_token(),
              user_id: user_id,
              title: normalize_title(Input.fetch_attr(attrs, :title)),
              search_indexable: Input.fetch_attr(attrs, :search_indexable) || false,
              version: facts.version,
              captured_at: facts.captured_at
            })
            |> Ecto.Changeset.put_change(:search_qualified, Seo.snapshot_qualified?(facts))
            |> insert_or_rollback()

          persist_facts(snapshot, facts)

          ComparisonSnapshot
          |> Repo.get!(snapshot.id)
          |> hydrate()
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
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
          |> hydrate_many()
          |> Map.new(&{&1.public_token, &1})
      end

    Map.new(tokens, &{&1, Map.get(snapshots, &1)})
  end

  @spec active_for_owner_query(pos_integer()) :: Ecto.Query.t()
  def active_for_owner_query(user_id) when is_integer(user_id) do
    ComparisonSnapshot
    |> where([snapshot], snapshot.user_id == ^user_id and is_nil(snapshot.revoked_at))
    |> order_by([snapshot], desc: snapshot.inserted_at, desc: snapshot.id)
    |> preload(^Capture.preloads())
  end

  @spec revoke(pos_integer(), Ecto.UUID.t(), keyword()) ::
          {:ok, ComparisonSnapshot.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke(user_id, entropy_id, opts \\ [])

  def revoke(user_id, entropy_id, opts)
      when is_integer(user_id) and is_binary(entropy_id) do
    now = Keyword.get(opts, :now, DateTime.utc_now()) |> DateTime.truncate(:microsecond)

    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id) do
      case Repo.transaction(fn ->
             snapshot =
               Repo.one(
                 from snapshot in ComparisonSnapshot,
                   where:
                     snapshot.user_id == ^user_id and snapshot.entropy_id == ^uuid and
                       is_nil(snapshot.revoked_at),
                   lock: "FOR UPDATE"
               )

             case snapshot do
               nil ->
                 Repo.rollback(:not_found)

               %ComparisonSnapshot{} ->
                 snapshot
                 |> ComparisonSnapshot.revoke_changeset(now)
                 |> Repo.update()
                 |> case do
                   {:ok, revoked_snapshot} -> revoked_snapshot
                   {:error, changeset} -> Repo.rollback(changeset)
                 end
             end
           end) do
        {:ok, snapshot} -> {:ok, hydrate(snapshot)}
        {:error, :not_found} -> {:error, :not_found}
        {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
      end
    else
      :error -> {:error, :not_found}
    end
  end

  def hydrate(nil), do: nil

  def hydrate(%ComparisonSnapshot{} = snapshot) do
    snapshot
    |> Repo.preload(Capture.preloads())
    |> Capture.hydrate()
  end

  def hydrate_many([]), do: []

  def hydrate_many(snapshots) when is_list(snapshots) do
    snapshots
    |> Repo.preload(Capture.preloads())
    |> Enum.map(&Capture.hydrate/1)
  end

  defp persist_facts(snapshot, facts) do
    facts.products
    |> Enum.with_index(1)
    |> Enum.each(fn {product, position} ->
      snapshot_product =
        %Product{}
        |> Product.changeset(%{
          comparison_snapshot_id: snapshot.id,
          position: position,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          model_number: product.model_number,
          brand_name: product.brand_name
        })
        |> insert_or_rollback()

      persist_attributes(snapshot_product, product.attributes)
      persist_offers(snapshot_product, product.offers)
    end)

    persist_recommendation(snapshot, facts.recommendation)
  end

  defp persist_attributes(snapshot_product, attributes) do
    attributes
    |> Enum.with_index(1)
    |> Enum.each(fn {attribute, position} ->
      snapshot_attribute =
        %Attribute{}
        |> Attribute.changeset(
          attribute
          |> Map.take([
            :attribute_id,
            :claim_id,
            :code,
            :display_name,
            :value_text,
            :source_type,
            :confidence
          ])
          |> Map.merge(%{snapshot_product_id: snapshot_product.id, position: position})
        )
        |> insert_or_rollback()

      attribute.evidence
      |> Enum.with_index(1)
      |> Enum.each(fn {evidence, evidence_position} ->
        %Evidence{}
        |> Evidence.changeset(
          evidence
          |> Map.put(:snapshot_attribute_id, snapshot_attribute.id)
          |> Map.put(:position, evidence_position)
        )
        |> insert_or_rollback()
      end)
    end)
  end

  defp persist_offers(snapshot_product, offers) do
    offers
    |> Enum.with_index(1)
    |> Enum.each(fn {offer, position} ->
      %Offer{}
      |> Offer.changeset(
        offer
        |> Map.put(:snapshot_product_id, snapshot_product.id)
        |> Map.put(:position, position)
      )
      |> insert_or_rollback()
    end)
  end

  defp persist_recommendation(snapshot, recommendation) do
    snapshot_recommendation =
      %Recommendation{}
      |> Recommendation.changeset(
        recommendation
        |> Map.take([
          :profile,
          :algorithm_version,
          :evaluated_at,
          :status,
          :winner_product_id,
          :currency,
          :missing_inputs
        ])
        |> Map.put(:comparison_snapshot_id, snapshot.id)
      )
      |> insert_or_rollback()

    Enum.each(recommendation.rankings, fn ranking ->
      %Ranking{}
      |> Ranking.changeset(
        Map.put(ranking, :snapshot_recommendation_id, snapshot_recommendation.id)
      )
      |> insert_or_rollback()
    end)
  end

  defp insert_or_rollback(changeset) do
    case Repo.insert(changeset) do
      {:ok, record} -> record
      {:error, %Ecto.Changeset{} = changeset} -> Repo.rollback(changeset)
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

  defp repeatable_read_transaction(fun) when is_function(fun, 0) do
    already_in_transaction? = Repo.in_transaction?()

    Repo.transaction(fn ->
      if already_in_transaction? do
        ensure_repeatable_read!()
      else
        Repo.query!("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
      end

      fun.()
    end)
  end

  defp ensure_repeatable_read! do
    case Repo.query!("SHOW transaction_isolation").rows do
      [[level]] when level in ["repeatable read", "serializable"] ->
        :ok

      [[level]] ->
        raise ArgumentError,
              "comparison snapshot publication requires repeatable read or serializable isolation, got: #{level}"
    end
  end

  defp normalize_title(nil), do: nil
  defp normalize_title(title) when is_binary(title), do: String.trim(title)
  defp normalize_title(_title), do: nil

  defp public_token, do: 32 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)
end
