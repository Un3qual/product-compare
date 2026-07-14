defmodule ProductCompare.Alerts do
  @moduledoc """
  Owner-scoped price watches, durable evaluation, and in-app alert events.
  """

  import Ecto.Query

  alias Ecto.Changeset
  alias ProductCompare.Pricing
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertDeliveryAttempt
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @max_bigint_id 9_223_372_036_854_775_807
  defguardp valid_id(id) when is_integer(id) and id > 0 and id <= @max_bigint_id

  @spec create_watch(pos_integer(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, Ecto.Changeset.t() | atom()}
  def create_watch(user_id, attrs) when valid_id(user_id) and is_map(attrs) do
    attrs = atomize_watch_attrs(attrs)
    product_id = Map.get(attrs, :product_id)
    merchant_product_id = Map.get(attrs, :merchant_product_id)
    currency = attrs |> Map.get(:currency) |> normalize_currency()
    now = DateTime.utc_now()

    with {:ok, scope} <- validate_scope(product_id, merchant_product_id, currency),
         fact <- current_scope_fact(scope, currency, now),
         baseline <- eligible_baseline(fact),
         create_attrs <-
           attrs
           |> Map.put(:user_id, user_id)
           |> Map.put(:product_id, product_id)
           |> Map.put(:merchant_product_id, merchant_product_id)
           |> Map.put(:currency, currency)
           |> Map.put(:baseline_price_point_id, baseline && baseline.price_point_id)
           |> Map.put(:baseline_landed_price, baseline && baseline.landed_price)
           |> Map.put_new(:last_condition_met, initial_condition(attrs, fact)),
         {:ok, watch} <-
           %PriceWatchRule{}
           |> PriceWatchRule.create_changeset(create_attrs)
           |> Repo.insert() do
      {:ok, load_watch!(watch.id)}
    end
  end

  def create_watch(_user_id, _attrs), do: {:error, :invalid_argument}

  @spec list_watch_rules_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_watch_rules_query(user_id, opts \\ []) do
    PriceWatchRule
    |> where([watch], watch.user_id == ^user_id)
    |> maybe_filter_watch_enabled(Keyword.get(opts, :enabled))
    |> order_by([watch], desc: watch.inserted_at, desc: watch.id)
    |> preload([:product, merchant_product: :merchant])
  end

  @spec list_alert_events_query(pos_integer(), keyword()) :: Ecto.Query.t()
  def list_alert_events_query(user_id, opts \\ []) do
    AlertEvent
    |> where([event], event.user_id == ^user_id)
    |> maybe_filter_unread(Keyword.get(opts, :unread_only, false))
    |> order_by([event], desc: event.inserted_at, desc: event.id)
    |> preload([:triggering_price_point, :watch_rule, merchant_product: [:merchant, :product]])
  end

  @spec update_watch(pos_integer(), Ecto.UUID.t(), map()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_watch(user_id, entropy_id, attrs) when valid_id(user_id) and is_binary(entropy_id) do
    case Repo.get_by(PriceWatchRule, user_id: user_id, entropy_id: entropy_id) do
      nil ->
        {:error, :not_found}

      watch ->
        watch
        |> Changeset.change(%{
          last_condition_met: false,
          last_evaluated_price_point_id: nil,
          last_evaluated_at: nil,
          last_event_at: nil
        })
        |> PriceWatchRule.update_changeset(atomize_watch_attrs(attrs))
        |> Repo.update()
    end
  end

  def update_watch(_user_id, _entropy_id, _attrs), do: {:error, :not_found}

  @spec delete_watch(pos_integer(), Ecto.UUID.t()) ::
          {:ok, PriceWatchRule.t()} | {:error, :not_found}
  def delete_watch(user_id, entropy_id) when valid_id(user_id) and is_binary(entropy_id) do
    case Repo.get_by(PriceWatchRule, user_id: user_id, entropy_id: entropy_id) do
      nil -> {:error, :not_found}
      watch -> Repo.delete(watch)
    end
  end

  def delete_watch(_user_id, _entropy_id), do: {:error, :not_found}

  @spec mark_alert_read(pos_integer(), Ecto.UUID.t()) ::
          {:ok, AlertEvent.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def mark_alert_read(user_id, entropy_id) when valid_id(user_id) and is_binary(entropy_id) do
    case Repo.get_by(AlertEvent, user_id: user_id, entropy_id: entropy_id) do
      nil -> {:error, :not_found}
      %AlertEvent{read_at: %DateTime{}} = event -> {:ok, event}
      event -> event |> AlertEvent.read_changeset(DateTime.utc_now()) |> Repo.update()
    end
  end

  def mark_alert_read(_user_id, _entropy_id), do: {:error, :not_found}

  @spec evaluate_price_point(pos_integer(), keyword()) ::
          {:ok, %{evaluated: non_neg_integer(), events_created: non_neg_integer()}}
          | {:error, :price_point_not_found}
  def evaluate_price_point(price_point_id, opts \\ [])

  def evaluate_price_point(price_point_id, opts) when valid_id(price_point_id) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    case Repo.get(PricePoint, price_point_id) |> Repo.preload(merchant_product: :product) do
      nil ->
        {:error, :price_point_not_found}

      %PricePoint{merchant_product: merchant_product} = price_point ->
        watches =
          Repo.all(
            from watch in PriceWatchRule,
              where: watch.enabled == true,
              where: watch.product_id == ^merchant_product.product_id,
              where: watch.currency == ^merchant_product.currency,
              where:
                is_nil(watch.merchant_product_id) or
                  watch.merchant_product_id == ^merchant_product.id,
              order_by: [asc: watch.id]
          )

        summary =
          Enum.reduce(watches, %{evaluated: 0, events_created: 0}, fn watch, summary ->
            case evaluate_watch(watch.id, price_point, now) do
              {:ok, created?} ->
                summary
                |> Map.update!(:evaluated, &(&1 + 1))
                |> Map.update!(:events_created, &(&1 + if(created?, do: 1, else: 0)))

              {:error, _reason} ->
                summary
            end
          end)

        {:ok, summary}
    end
  end

  def evaluate_price_point(_price_point_id, _opts), do: {:error, :price_point_not_found}

  defp evaluate_watch(watch_id, triggering_price_point, now) do
    Repo.transaction(fn ->
      watch =
        Repo.one!(
          from watch in PriceWatchRule,
            where: watch.id == ^watch_id,
            lock: "FOR UPDATE"
        )

      scope = %{product_id: watch.product_id, merchant_product_id: watch.merchant_product_id}
      fact = current_scope_fact(scope, watch.currency, now, triggering_price_point)
      condition_met = condition_met?(watch, fact)

      create_event? =
        condition_met and fact.eligible and
          (watch.last_condition_met == false or cooldown_elapsed?(watch, now))

      created? = create_event? and insert_event(watch, fact, now)

      evaluation_attrs = %{
        last_evaluated_price_point_id: fact.price_point_id || triggering_price_point.id,
        last_condition_met: condition_met,
        last_evaluated_at: now,
        last_event_at: if(created?, do: now, else: watch.last_event_at)
      }

      case watch |> PriceWatchRule.evaluation_changeset(evaluation_attrs) |> Repo.update() do
        {:ok, _watch} -> created?
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp insert_event(watch, fact, now) do
    attrs = %{
      watch_rule_id: watch.id,
      user_id: watch.user_id,
      triggering_price_point_id: fact.price_point_id,
      merchant_product_id: fact.merchant_product_id,
      rule_type: watch.rule_type,
      currency: watch.currency,
      item_price: fact.item_price,
      shipping: fact.shipping,
      landed_price: fact.landed_price,
      observed_at: fact.observed_at,
      fact_snapshot: fact_snapshot(watch, fact)
    }

    case %AlertEvent{}
         |> AlertEvent.changeset(attrs)
         |> Repo.insert(
           on_conflict: :nothing,
           conflict_target: [:watch_rule_id, :triggering_price_point_id],
           returning: true
         ) do
      {:ok, %AlertEvent{id: nil}} ->
        false

      {:ok, event} ->
        %AlertDeliveryAttempt{}
        |> AlertDeliveryAttempt.changeset(%{
          alert_event_id: event.id,
          transport: :in_app,
          state: :delivered,
          attempted_at: now,
          delivered_at: now
        })
        |> Repo.insert!()

        true

      {:error, reason} ->
        Repo.rollback(reason)
    end
  end

  defp fact_snapshot(watch, fact) do
    %{
      "rule_type" => Atom.to_string(watch.rule_type),
      "currency" => watch.currency,
      "merchant_product_id" => fact.merchant_product_id,
      "price_point_id" => fact.price_point_id,
      "item_price" => Decimal.to_string(fact.item_price, :normal),
      "shipping" => Decimal.to_string(fact.shipping, :normal),
      "landed_price" => Decimal.to_string(fact.landed_price, :normal),
      "observed_at" => DateTime.to_iso8601(fact.observed_at),
      "baseline_landed_price" => decimal_string(watch.baseline_landed_price),
      "target_amount" => decimal_string(watch.target_amount),
      "percentage_drop" => decimal_string(watch.percentage_drop)
    }
  end

  defp validate_scope(product_id, merchant_product_id, currency) when valid_id(product_id) do
    with %Product{} <- Repo.get(Product, product_id),
         {:ok, merchant_product} <-
           validate_scope_offer(product_id, merchant_product_id, currency) do
      {:ok,
       %{product_id: product_id, merchant_product_id: merchant_product && merchant_product.id}}
    else
      nil -> {:error, :product_not_found}
      {:error, _reason} = error -> error
    end
  end

  defp validate_scope(_product_id, _merchant_product_id, _currency),
    do: {:error, :product_not_found}

  defp validate_scope_offer(_product_id, nil, _currency), do: {:ok, nil}

  defp validate_scope_offer(product_id, merchant_product_id, currency)
       when valid_id(merchant_product_id) do
    case Repo.get(MerchantProduct, merchant_product_id) do
      %MerchantProduct{product_id: ^product_id, currency: ^currency} = merchant_product ->
        {:ok, merchant_product}

      _ ->
        {:error, invalid_scope_changeset(product_id, merchant_product_id, currency)}
    end
  end

  defp validate_scope_offer(product_id, merchant_product_id, currency),
    do: {:error, invalid_scope_changeset(product_id, merchant_product_id, currency)}

  defp invalid_scope_changeset(product_id, merchant_product_id, currency) do
    %PriceWatchRule{}
    |> PriceWatchRule.create_changeset(%{
      user_id: 1,
      product_id: product_id,
      merchant_product_id: merchant_product_id,
      rule_type: :target_price,
      currency: currency,
      target_amount: 0
    })
    |> Changeset.add_error(:merchant_product_id, "must belong to the product and currency")
  end

  defp current_scope_fact(scope, currency, now, triggering_price_point \\ nil)

  defp current_scope_fact(%{merchant_product_id: merchant_product_id}, currency, now, _trigger)
       when is_integer(merchant_product_id) do
    merchant_product = Repo.get!(MerchantProduct, merchant_product_id)
    price_point = Pricing.latest_price(merchant_product_id)

    merchant_product
    |> OfferTruth.summarize(price_point, now)
    |> fact_from_offer(currency)
  end

  defp current_scope_fact(%{product_id: product_id}, currency, now, triggering_price_point) do
    best_offer =
      product_id
      |> Pricing.current_offer_truth(now: now)
      |> Map.fetch!(:currency_summaries)
      |> Enum.find(&(&1.currency == currency))
      |> case do
        nil -> nil
        summary -> summary.best_offer
      end

    fallback_offer =
      case triggering_price_point do
        %PricePoint{merchant_product: %MerchantProduct{} = merchant_product} ->
          OfferTruth.summarize(merchant_product, triggering_price_point, now)

        _ ->
          nil
      end

    fact_from_offer(best_offer || fallback_offer, currency)
  end

  defp fact_from_offer(nil, currency), do: empty_fact(currency)

  defp fact_from_offer(%{currency: currency} = offer, currency) do
    %{
      eligible: offer.eligible,
      currency: currency,
      merchant_product_id: offer.merchant_product_id,
      price_point_id: Map.get(offer, :price_point_id),
      item_price: offer.item_price,
      shipping: offer.shipping,
      landed_price: offer.landed_price,
      observed_at: offer.observed_at
    }
  end

  defp fact_from_offer(_offer, currency), do: empty_fact(currency)

  defp empty_fact(currency) do
    %{
      eligible: false,
      currency: currency,
      merchant_product_id: nil,
      price_point_id: nil,
      item_price: nil,
      shipping: nil,
      landed_price: nil,
      observed_at: nil
    }
  end

  defp eligible_baseline(%{eligible: true, landed_price: %Decimal{}} = fact), do: fact
  defp eligible_baseline(_fact), do: nil

  defp initial_condition(attrs, fact) do
    case Map.get(attrs, :rule_type) do
      rule when rule in [:back_in_stock, :newly_available] -> fact.eligible
      _ -> false
    end
  end

  defp condition_met?(%PriceWatchRule{rule_type: :target_price} = watch, fact) do
    fact.eligible and decimal_lte?(fact.landed_price, watch.target_amount)
  end

  defp condition_met?(%PriceWatchRule{rule_type: :percentage_drop} = watch, fact) do
    threshold =
      watch.baseline_landed_price
      |> Decimal.mult(Decimal.sub(Decimal.new(1), Decimal.div(watch.percentage_drop, 100)))

    fact.eligible and decimal_lte?(fact.landed_price, threshold)
  end

  defp condition_met?(%PriceWatchRule{rule_type: rule}, fact)
       when rule in [:back_in_stock, :newly_available],
       do: fact.eligible

  defp cooldown_elapsed?(%PriceWatchRule{last_event_at: nil}, _now), do: true

  defp cooldown_elapsed?(watch, now) do
    DateTime.diff(now, watch.last_event_at, :second) >= watch.cooldown_seconds
  end

  defp decimal_lte?(%Decimal{} = left, %Decimal{} = right),
    do: Decimal.compare(left, right) in [:lt, :eq]

  defp decimal_lte?(_left, _right), do: false

  defp maybe_filter_watch_enabled(query, enabled) when is_boolean(enabled),
    do: where(query, [watch], watch.enabled == ^enabled)

  defp maybe_filter_watch_enabled(query, _enabled), do: query

  defp maybe_filter_unread(query, true), do: where(query, [event], is_nil(event.read_at))
  defp maybe_filter_unread(query, _unread_only), do: query

  defp atomize_watch_attrs(attrs) do
    allowed = [
      :product_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :target_amount,
      :percentage_drop,
      :enabled,
      :cooldown_seconds
    ]

    Map.new(allowed, fn key -> {key, Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))} end)
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp normalize_currency(currency) when is_binary(currency), do: String.upcase(currency)
  defp normalize_currency(currency), do: currency
  defp decimal_string(%Decimal{} = value), do: Decimal.to_string(value, :normal)
  defp decimal_string(_value), do: nil

  defp load_watch!(watch_id) do
    PriceWatchRule
    |> Repo.get!(watch_id)
    |> Repo.preload([:product, merchant_product: :merchant])
  end
end
