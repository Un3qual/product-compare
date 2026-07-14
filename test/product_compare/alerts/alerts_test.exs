defmodule ProductCompare.AlertsTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Alerts
  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertDeliveryAttempt
  alias ProductCompareSchemas.Alerts.AlertEvent

  @now ~U[2026-07-13 20:00:00Z]

  test "target watches fire once per edge or cooled qualifying observation" do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")
    baseline = price_fixture(offer, "100", "0", true, @now)

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

    crossing = price_fixture(offer, "89", "0", true, DateTime.add(@now, 60, :second))

    assert {:ok, %{events_created: 1}} =
             Alerts.evaluate_price_point(crossing.id, now: crossing.observed_at)

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(crossing.id, now: crossing.observed_at)

    still_true = price_fixture(offer, "85", "0", true, DateTime.add(@now, 120, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(still_true.id, now: still_true.observed_at)

    cooled = price_fixture(offer, "80", "0", true, DateTime.add(@now, 3_700, :second))

    assert {:ok, %{events_created: 1}} =
             Alerts.evaluate_price_point(cooled.id, now: cooled.observed_at)

    assert Repo.aggregate(AlertEvent, :count, :id) == 2
    assert Repo.aggregate(AlertDeliveryAttempt, :count, :id) == 2

    [first | _] = Repo.all(Alerts.list_alert_events_query(user.id))
    assert first.triggering_price_point_id == cooled.id
    assert first.currency == "USD"
    assert Decimal.eq?(first.landed_price, Decimal.new("80"))
    assert first.read_at == nil
  end

  test "stale, incomplete, out-of-stock, and wrong-currency observations never trigger" do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    {:ok, _watch} =
      Alerts.create_watch(user.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "100"
      })

    stale = price_fixture(offer, "50", "0", true, DateTime.add(@now, -400_000, :second))
    assert {:ok, %{events_created: 0}} = Alerts.evaluate_price_point(stale.id, now: @now)

    incomplete = price_fixture(offer, "40", nil, true, DateTime.add(@now, 1, :second))

    assert {:ok, %{events_created: 0}} =
             Alerts.evaluate_price_point(incomplete.id, now: incomplete.observed_at)

    unavailable = price_fixture(offer, "30", "0", false, DateTime.add(@now, 2, :second))

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

  test "percentage and availability watches use captured baselines and reset truth" do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")
    baseline = price_fixture(offer, "100", "10", true, @now)

    assert {:ok, percent_watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               merchant_product_id: offer.id,
               rule_type: :percentage_drop,
               currency: "USD",
               percentage_drop: "20"
             })

    assert Decimal.eq?(percent_watch.baseline_landed_price, Decimal.new("110"))

    unavailable = price_fixture(offer, "100", "10", false, DateTime.add(@now, 30, :second))

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

    restored = price_fixture(offer, "80", "5", true, DateTime.add(@now, 60, :second))

    assert {:ok, %{events_created: 2}} =
             Alerts.evaluate_price_point(restored.id, now: restored.observed_at)

    assert Repo.aggregate(AlertEvent, :count, :id) == 2
    assert baseline.id == percent_watch.baseline_price_point_id
  end

  test "watch and inbox reads, updates, deletes, and read state are owner scoped" do
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

    point = price_fixture(offer, "40", "0", true, @now)
    {:ok, %{events_created: 1}} = Alerts.evaluate_price_point(point.id, now: @now)
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

  test "durable evaluation jobs are unique and replay safe" do
    %{merchant_product: offer} = offer_fixture("USD")
    point = price_fixture(offer, "10", "0", true, @now)

    assert {:ok, first_job} = AlertEvaluationWorker.enqueue(point.id)
    assert {:ok, duplicate_job} = AlertEvaluationWorker.enqueue(point.id)
    assert duplicate_job.conflict?
    assert duplicate_job.id == first_job.id
    assert first_job.args == %{"price_point_id" => point.id}
    assert :ok = AlertEvaluationWorker.perform(struct!(Oban.Job, args: first_job.args))
  end

  test "a failed watch evaluation makes the price-point evaluation retryable" do
    user = AccountsFixtures.user_fixture()
    %{product: product, merchant_product: offer} = offer_fixture("USD")

    assert {:ok, watch} =
             Alerts.create_watch(user.id, %{
               product_id: product.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "50"
             })

    point = price_fixture(offer, "40", "0", true, @now)

    assert {:error, {:watch_evaluation_failed, watch_id, :forced_failure}} =
             Alerts.evaluate_price_point(point.id,
               now: @now,
               watch_evaluator: fn _watch_id, _price_point, _now ->
                 {:error, :forced_failure}
               end
             )

    assert watch_id == watch.id
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
        last_seen_at: @now
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
end
