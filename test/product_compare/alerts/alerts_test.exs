defmodule ProductCompare.AlertsTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Alerts
  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertDeliveryAttempt
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.Cooldown

  setup do
    {:ok, now: DateTime.utc_now() |> DateTime.truncate(:second)}
  end

  test "target watches fire once per edge or cooled qualifying observation", %{now: now} do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")
    baseline = price_fixture(offer, "100", "0", true, now)

    assert {:ok, watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               rule_type: :target_price,
               currency: "usd",
               target_amount: "90",
               cooldown_seconds: 3_600
             })

    assert watch.baseline_price_point_id == baseline.id
    assert Decimal.eq?(watch.baseline_landed_price, Decimal.new("100"))
    assert %Duration{second: 3_600} = watch.cooldown

    crossing = price_fixture(offer, "89", "0", true, DateTime.add(now, 60, :second))

    assert {:ok, %{events_created: 1}} =
             Alerts.evaluate_price_point(crossing.id, now: crossing.observed_at)

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(crossing.id, now: crossing.observed_at)

    still_true = price_fixture(offer, "85", "0", true, DateTime.add(now, 120, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(still_true.id, now: still_true.observed_at)

    one_second_before_cooldown =
      price_fixture(offer, "80", "0", true, DateTime.add(now, 3_659, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(one_second_before_cooldown.id,
               now: one_second_before_cooldown.observed_at
             )

    cooled = price_fixture(offer, "80", "0", true, DateTime.add(now, 3_660, :second))

    assert {:ok, %{events_created: 1}} =
             Alerts.evaluate_price_point(cooled.id, now: cooled.observed_at)

    assert Repo.aggregate(AlertEvent, :count, :id) == 2
    assert Repo.aggregate(AlertDeliveryAttempt, :count, :id) == 2

    [first | _] = Repo.all(Alerts.list_alert_events_query(user.id))
    assert first.triggering_price_point_id == cooled.id
    assert first.currency == "USD"
    assert Decimal.eq?(first.landed_price, Decimal.new("80"))
    assert Decimal.eq?(first.baseline_landed_price, Decimal.new("100"))
    assert Decimal.eq?(first.target_amount, Decimal.new("90"))
    assert first.percentage_drop == nil
    assert first.read_at == nil
  end

  test "cooldown conversion accepts only exact elapsed whole seconds" do
    assert {:ok, %Duration{second: 60}} = Cooldown.from_seconds(60)
    assert {:ok, %Duration{second: 31_536_000}} = Cooldown.from_seconds(31_536_000)
    assert Cooldown.from_seconds(59) == :error
    assert Cooldown.from_seconds(31_536_001) == :error
    assert Cooldown.from_seconds(60.0) == :error

    assert {:ok, 86_400} = Cooldown.to_seconds(Duration.new!(day: 1))
    assert {:ok, 604_800} = Cooldown.to_seconds(Duration.new!(week: 1))
    assert Cooldown.to_seconds(Duration.new!(month: 1)) == :error
    assert Cooldown.to_seconds(Duration.new!(second: 60, microsecond: {1, 6})) == :error
    assert Cooldown.to_seconds(Duration.new!(second: -60)) == :error
  end

  test "stale, incomplete, out-of-stock, and wrong-currency observations never trigger", %{
    now: now
  } do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    {:ok, _watch} =
      Alerts.create_watch(user.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "100"
      })

    stale = price_fixture(offer, "50", "0", true, DateTime.add(now, -400_000, :second))
    assert {:ok, %{events_created: 0}} = Alerts.evaluate_price_point(stale.id, now: now)

    incomplete = price_fixture(offer, "40", nil, true, DateTime.add(now, 1, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(incomplete.id, now: incomplete.observed_at)

    unavailable = price_fixture(offer, "30", "0", false, DateTime.add(now, 2, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(unavailable.id, now: unavailable.observed_at)

    assert Repo.aggregate(AlertEvent, :count, :id) == 0

    assert {:error, %Ecto.Changeset{}} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               merchant_product_id: offer.id,
               rule_type: :target_price,
               currency: "EUR",
               target_amount: "25"
             })
  end

  test "percentage and availability watches use captured baselines and reset truth", %{now: now} do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")
    baseline = price_fixture(offer, "100", "10", true, now)

    assert {:ok, percent_watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               merchant_product_id: offer.id,
               rule_type: :percentage_drop,
               currency: "USD",
               percentage_drop: "20"
             })

    assert Decimal.eq?(percent_watch.baseline_landed_price, Decimal.new("110"))

    unavailable = price_fixture(offer, "100", "10", false, DateTime.add(now, 30, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(unavailable.id, now: unavailable.observed_at)

    assert {:ok, availability_watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               merchant_product_id: offer.id,
               rule_type: :back_in_stock,
               currency: "USD"
             })

    refute availability_watch.last_condition_met

    restored = price_fixture(offer, "80", "5", true, DateTime.add(now, 60, :second))

    assert {:ok, %{events_created: 2}} =
             Alerts.evaluate_price_point(restored.id, now: restored.observed_at)

    assert Repo.aggregate(AlertEvent, :count, :id) == 2
    assert baseline.id == percent_watch.baseline_price_point_id

    percent_event = Repo.get_by!(AlertEvent, watch_rule_id: percent_watch.id)
    assert Decimal.eq?(percent_event.baseline_landed_price, Decimal.new("110"))
    assert Decimal.eq?(percent_event.percentage_drop, Decimal.new("20"))
    assert percent_event.target_amount == nil

    availability_event = Repo.get_by!(AlertEvent, watch_rule_id: availability_watch.id)
    assert availability_event.baseline_landed_price == nil
    assert availability_event.target_amount == nil
    assert availability_event.percentage_drop == nil
  end

  test "watch and inbox reads, updates, deletes, and read state are owner scoped", %{now: now} do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    {:ok, watch} =
      Alerts.create_watch(owner.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "50"
      })

    point = price_fixture(offer, "40", "0", true, now)
    {:ok, %{events_created: 1}} = Alerts.evaluate_price_point(point.id, now: now)
    [event] = Repo.all(Alerts.list_alert_events_query(owner.id))

    assert [] == Repo.all(Alerts.list_watch_rules_query(stranger.id))
    assert [] == Repo.all(Alerts.list_alert_events_query(stranger.id))
    assert {:error, :not_found} = Alerts.mark_alert_read(stranger.id, event.entropy_id)

    assert {:error, :not_found} =
             Alerts.update_watch(stranger.id, watch.entropy_id, %{enabled: false})

    assert {:error, :not_found} = Alerts.delete_watch(stranger.id, watch.entropy_id)

    assert {:ok, updated} = Alerts.update_watch(owner.id, watch.entropy_id, %{enabled: false})
    refute updated.enabled
    assert {:ok, read} = Alerts.mark_alert_read(owner.id, event.entropy_id)
    assert read.read_at
    assert {:ok, _deleted} = Alerts.delete_watch(owner.id, watch.entropy_id)
    assert Repo.all(Alerts.list_watch_rules_query(owner.id)) == []
  end

  test "durable evaluation jobs are unique and replay safe", %{now: now} do
    %{merchant_product: offer} = offer_fixture("USD")
    point = price_fixture(offer, "10", "0", true, now)

    assert {:ok, first_job} = AlertEvaluationWorker.enqueue(point.id)
    assert {:ok, duplicate_job} = AlertEvaluationWorker.enqueue(point.id)
    assert duplicate_job.conflict?
    assert duplicate_job.id == first_job.id
    assert first_job.args == %{"price_point_id" => point.id}
    assert :ok = AlertEvaluationWorker.perform(struct!(Oban.Job, args: first_job.args))
  end

  test "a failed watch does not starve later watch evaluations", %{now: now} do
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    watches =
      Enum.map(1..3, fn _index ->
        user = AccountsFixtures.user_fixture()

        assert {:ok, watch} =
                 Alerts.create_watch(user.id, %{
                   product_id: product.id,
                   rule_type: :target_price,
                   currency: "USD",
                   target_amount: "50"
                 })

        watch
      end)

    [failed_watch | successful_watches] = watches

    point = price_fixture(offer, "40", "0", true, now)
    parent = self()

    assert {:error,
            {:watch_evaluations_failed, failed_watch_ids, %{evaluated: 2, events_created: 2}}} =
             Alerts.evaluate_price_point(point.id,
               now: now,
               watch_evaluator: fn watch_id, _price_point, _now ->
                 send(parent, {:evaluated, watch_id})

                 if watch_id == failed_watch.id,
                   do: {:error, :forced_failure},
                   else: {:ok, true}
               end
             )

    assert failed_watch_ids == [failed_watch.id]
    assert_receive {:evaluated, watch_id}
    assert watch_id == failed_watch.id

    Enum.each(successful_watches, fn watch ->
      assert_receive {:evaluated, watch_id}
      assert watch_id == watch.id
    end)
  end

  test "retrying a partial evaluation does not duplicate successful events", %{now: now} do
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    watches =
      Enum.map(1..3, fn _index ->
        user = AccountsFixtures.user_fixture()

        assert {:ok, watch} =
                 Alerts.create_watch(user.id, %{
                   product_id: product.id,
                   rule_type: :target_price,
                   currency: "USD",
                   target_amount: "50"
                 })

        watch
      end)

    [failed_watch | _later_watches] = watches
    point = price_fixture(offer, "40", "0", true, now)
    failure_key = {__MODULE__, make_ref()}

    evaluator = fn watch_id, price_point, evaluated_at, evaluate_watch ->
      if watch_id == failed_watch.id and Process.get(failure_key) == nil do
        Process.put(failure_key, :failed)
        {:error, :forced_failure}
      else
        evaluate_watch.(watch_id, price_point, evaluated_at)
      end
    end

    assert {:error,
            {:watch_evaluations_failed, [failed_watch_id], %{evaluated: 2, events_created: 2}}} =
             Alerts.evaluate_price_point(point.id,
               now: now,
               watch_evaluator: evaluator
             )

    assert failed_watch_id == failed_watch.id
    assert Repo.aggregate(AlertEvent, :count, :id) == 2

    assert {:ok, %{evaluated: 3, events_created: 1}} =
             Alerts.evaluate_price_point(point.id,
               now: now,
               watch_evaluator: evaluator
             )

    assert Repo.aggregate(AlertEvent, :count, :id) == 3
    assert Repo.aggregate(AlertDeliveryAttempt, :count, :id) == 3
  end

  test "mixed watch evaluation reuses shared market facts as watch count grows", %{now: now} do
    two_watch_run = mixed_watch_evaluation_fixture(2, now)
    six_watch_run = mixed_watch_evaluation_fixture(6, DateTime.add(now, 10, :second))

    {two_watch_result, two_watch_queries} =
      capture_select_queries(fn ->
        Alerts.evaluate_price_point(two_watch_run.trigger.id,
          now: two_watch_run.trigger.observed_at
        )
      end)

    {six_watch_result, six_watch_queries} =
      capture_select_queries(fn ->
        Alerts.evaluate_price_point(six_watch_run.trigger.id,
          now: six_watch_run.trigger.observed_at
        )
      end)

    assert two_watch_result == {:ok, %{evaluated: 2, events_created: 2}}
    assert six_watch_result == {:ok, %{evaluated: 6, events_created: 6}}
    assert_event_facts(two_watch_run, 2)
    assert_event_facts(six_watch_run, 6)

    two_watch_budget = alert_evaluation_query_budget(two_watch_queries)
    six_watch_budget = alert_evaluation_query_budget(six_watch_queries)

    assert {two_watch_budget, six_watch_budget} == {
             %{
               triggering_price_point_reads: 1,
               triggering_merchant_product_reads: 1,
               applicable_watch_reads: 1,
               shared_merchant_product_reads: 2,
               shared_latest_price_reads: 2,
               watch_lock_reads: 2
             },
             %{two_watch_budget | watch_lock_reads: 6}
           }
  end

  defp offer_fixture(currency) do
    product = SpecsFixtures.product_fixture()

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Watch Merchant #{System.unique_integer([:positive])}",
        domain: "watch-#{System.unique_integer([:positive])}.example"
      })

    {:ok, merchant_product} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://merchant.example/#{System.unique_integer([:positive])}",
        currency: currency,
        is_active: true,
        last_seen_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })

    %{product: product, merchant: merchant, merchant_product: merchant_product}
  end

  defp price_fixture(offer, price, shipping, in_stock, observed_at) do
    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: observed_at,
        price: Decimal.new(price),
        shipping: shipping && Decimal.new(shipping),
        in_stock: in_stock
      })

    point
  end

  defp mixed_watch_evaluation_fixture(watch_count, now) do
    %{product: product, merchant_product: offer} = offer_fixture("USD")
    _baseline = price_fixture(offer, "100", "0", true, now)

    Enum.each(1..watch_count, fn index ->
      user = AccountsFixtures.user_fixture()

      attrs = %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "50"
      }

      attrs =
        if rem(index, 2) == 0, do: Map.put(attrs, :merchant_product_id, offer.id), else: attrs

      assert {:ok, _watch} = Alerts.create_watch(user.id, attrs)
    end)

    trigger = price_fixture(offer, "40", "5", true, DateTime.add(now, 1, :second))
    %{offer: offer, trigger: trigger}
  end

  defp assert_event_facts(%{offer: offer, trigger: trigger}, expected_count) do
    events =
      AlertEvent
      |> Repo.all()
      |> Enum.filter(&(&1.triggering_price_point_id == trigger.id))

    assert length(events) == expected_count

    assert Enum.all?(events, fn event ->
             event.merchant_product_id == offer.id and
               event.currency == "USD" and
               Decimal.eq?(event.item_price, Decimal.new("40")) and
               Decimal.eq?(event.shipping, Decimal.new("5")) and
               Decimal.eq?(event.landed_price, Decimal.new("45")) and
               event.observed_at == trigger.observed_at
           end)
  end

  defp alert_evaluation_query_budget(queries) do
    {trigger_queries, watch_queries} =
      Enum.split_while(queries, &(not applicable_watch_query?(&1)))

    [_applicable_watch_query | evaluation_queries] = watch_queries

    %{
      triggering_price_point_reads:
        Enum.count(trigger_queries, &query_targets_table?(&1, :price_points)),
      triggering_merchant_product_reads:
        Enum.count(trigger_queries, &query_targets_table?(&1, :merchant_products)),
      applicable_watch_reads: Enum.count(queries, &applicable_watch_query?/1),
      shared_merchant_product_reads:
        Enum.count(evaluation_queries, &query_targets_table?(&1, :merchant_products)),
      shared_latest_price_reads:
        Enum.count(evaluation_queries, &query_targets_table?(&1, :price_points)),
      watch_lock_reads:
        Enum.count(queries, fn query ->
          query_targets_table?(query, :price_watch_rules) and
            String.contains?(query, "FOR UPDATE")
        end)
    }
  end

  defp applicable_watch_query?(query) do
    query_targets_table?(query, :price_watch_rules) and
      not String.contains?(query, "FOR UPDATE")
  end

  defp query_targets_table?(query, table) do
    String.contains?(query, ~s(FROM "#{table}"))
  end
end
