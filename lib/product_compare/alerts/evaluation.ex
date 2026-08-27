defmodule ProductCompare.Alerts.Evaluation do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts.MarketFacts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertDeliveryAttempt
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.Cooldown
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Pricing.PricePoint

  @spec evaluate_price_point(pos_integer(), keyword()) ::
          {:ok, %{evaluated: non_neg_integer(), events_created: non_neg_integer()}}
          | {:error,
             :price_point_not_found
             | {:watch_evaluations_failed, [pos_integer()],
                %{
                  evaluated: non_neg_integer(),
                  events_created: non_neg_integer()
                }}}
  def evaluate_price_point(price_point_id, opts \\ [])

  def evaluate_price_point(price_point_id, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    watch_evaluator =
      case Keyword.fetch(opts, :watch_evaluator) do
        :error -> :default
        {:ok, evaluator} -> evaluator
      end

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

        evaluation_facts =
          if watch_evaluator == :default do
            evaluation_facts(watches, merchant_product, price_point, now)
          end

        {summary, failed_watch_ids} =
          Enum.reduce(
            watches,
            {%{evaluated: 0, events_created: 0}, []},
            fn watch, {summary, failed_watch_ids} ->
              case run_watch_evaluator(
                     watch_evaluator,
                     watch.id,
                     price_point,
                     now,
                     evaluation_facts
                   ) do
                {:ok, created?} ->
                  updated_summary =
                    summary
                    |> Map.update!(:evaluated, &(&1 + 1))
                    |> Map.update!(:events_created, &(&1 + if(created?, do: 1, else: 0)))

                  {updated_summary, failed_watch_ids}

                {:error, _reason} ->
                  {summary, [watch.id | failed_watch_ids]}
              end
            end
          )

        case Enum.reverse(failed_watch_ids) do
          [] -> {:ok, summary}
          ids -> {:error, {:watch_evaluations_failed, ids, summary}}
        end
    end
  end

  defp run_watch_evaluator(:default, watch_id, price_point, now, evaluation_facts) do
    evaluate_watch(watch_id, price_point, now, evaluation_facts)
  end

  defp run_watch_evaluator(evaluator, watch_id, price_point, now, _evaluation_facts)
       when is_function(evaluator, 4) do
    evaluator.(watch_id, price_point, now, &evaluate_watch/3)
  end

  defp run_watch_evaluator(evaluator, watch_id, price_point, now, _evaluation_facts)
       when is_function(evaluator, 3) do
    evaluator.(watch_id, price_point, now)
  end

  defp evaluate_watch(watch_id, triggering_price_point, now) do
    evaluate_watch(watch_id, triggering_price_point, now, nil)
  end

  defp evaluate_watch(watch_id, triggering_price_point, now, evaluation_facts) do
    Repo.transaction(fn ->
      watch =
        Repo.one!(
          from watch in PriceWatchRule,
            where: watch.id == ^watch_id,
            lock: "FOR UPDATE"
        )

      fact =
        case evaluation_facts do
          %{} -> Map.fetch!(evaluation_facts, watch_scope(watch))
          nil -> current_watch_scope_fact(watch, triggering_price_point, now)
        end

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

  # One fact per scope is sufficient because the applicable-watch query above
  # restricts every listing-scoped watch to this triggering merchant product.
  # If that query admits other listings, this must compute one fact per listing.
  defp evaluation_facts(watches, merchant_product, triggering_price_point, now) do
    watches
    |> Enum.map(&watch_scope/1)
    |> MapSet.new()
    |> Map.new(fn
      :product ->
        scope = %{product_id: merchant_product.product_id, merchant_product_id: nil}

        {:product,
         MarketFacts.current_scope_fact(
           scope,
           merchant_product.currency,
           now,
           triggering_price_point
         )}

      :listing ->
        scope = %{
          product_id: merchant_product.product_id,
          merchant_product_id: merchant_product.id
        }

        {:listing,
         MarketFacts.current_scope_fact(
           scope,
           merchant_product.currency,
           now,
           triggering_price_point
         )}
    end)
  end

  defp current_watch_scope_fact(watch, triggering_price_point, now) do
    scope = %{product_id: watch.product_id, merchant_product_id: watch.merchant_product_id}
    MarketFacts.current_scope_fact(scope, watch.currency, now, triggering_price_point)
  end

  defp watch_scope(%PriceWatchRule{merchant_product_id: merchant_product_id})
       when is_integer(merchant_product_id),
       do: :listing

  defp watch_scope(%PriceWatchRule{}), do: :product

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
      baseline_landed_price: watch.baseline_landed_price,
      target_amount: watch.target_amount,
      percentage_drop: watch.percentage_drop
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
    case Cooldown.to_seconds(watch.cooldown) do
      {:ok, cooldown_seconds} ->
        DateTime.diff(now, watch.last_event_at, :second) >= cooldown_seconds

      :error ->
        false
    end
  end

  defp decimal_lte?(%Decimal{} = left, %Decimal{} = right),
    do: Decimal.compare(left, right) in [:lt, :eq]

  defp decimal_lte?(_left, _right), do: false
end
