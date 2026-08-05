defmodule ProductCompare.Repo.CapturedNumericEvidenceConstraintsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures

  test "comparison snapshot attribute confidence accepts null and endpoints and rejects values outside zero through one" do
    snapshot_product_id = insert_snapshot_product!()

    assert {:ok, _result} = insert_snapshot_attribute(snapshot_product_id, 1, "NULL")
    assert {:ok, _result} = insert_snapshot_attribute(snapshot_product_id, 2, "0")
    assert {:ok, _result} = insert_snapshot_attribute(snapshot_product_id, 3, "1")

    for {position, confidence} <- [{4, "-0.01"}, {5, "1.01"}] do
      assert_check_violation(
        insert_snapshot_attribute(snapshot_product_id, position, confidence),
        "comparison_snapshot_attributes_confidence_range"
      )
    end
  end

  test "comparison snapshot offers accept finite zero amounts and reject invalid copied prices" do
    snapshot_product_id = insert_snapshot_product!()

    assert {:ok, _result} = insert_snapshot_offer(snapshot_product_id, 1, "0", "0", "0")

    for {position, item_price, shipping, landed_price} <- [
          {2, "-0.01", "0", "0"},
          {3, "0", "-0.01", "0"},
          {4, "0", "0", "-0.01"},
          {5, "'NaN'::numeric", "0", "0"},
          {6, "0", "'NaN'::numeric", "0"},
          {7, "0", "0", "'NaN'::numeric"},
          {8, "'Infinity'::numeric", "0", "0"},
          {9, "0", "'Infinity'::numeric", "0"},
          {10, "0", "0", "'Infinity'::numeric"}
        ] do
      assert_check_violation(
        insert_snapshot_offer(snapshot_product_id, position, item_price, shipping, landed_price),
        "comparison_snapshot_offers_amounts_non_negative"
      )
    end
  end

  test "comparison snapshot rankings accept finite zero landed price and reject invalid landed price" do
    snapshot_recommendation_id = insert_snapshot_recommendation!()

    assert {:ok, _result} = insert_snapshot_ranking(snapshot_recommendation_id, 1, "0")

    for {rank, landed_price} <- [
          {2, "-0.01"},
          {3, "'NaN'::numeric"},
          {4, "'Infinity'::numeric"}
        ] do
      assert_check_violation(
        insert_snapshot_ranking(snapshot_recommendation_id, rank, landed_price),
        "comparison_snapshot_rankings_landed_price_non_negative"
      )
    end
  end

  test "price watch rules accept null and finite zero captured baselines and reject invalid captured baselines" do
    %{id: user_id} = AccountsFixtures.user_fixture()
    %{id: product_id} = SpecsFixtures.product_fixture()

    assert {:ok, _result} = insert_price_watch_rule_without_baseline(user_id, product_id)
    assert {:ok, _result} = insert_price_watch_rule(user_id, product_id, "0")

    for baseline_landed_price <- ["-0.01", "'NaN'::numeric", "'Infinity'::numeric"] do
      assert_check_violation(
        insert_price_watch_rule(user_id, product_id, baseline_landed_price),
        "price_watch_rules_baseline_landed_price_non_negative"
      )
    end
  end

  test "price point sources reject non-finite amounts before evidence capture" do
    %{merchant_product_id: merchant_product_id} = insert_alert_event_parents!()

    assert {:ok, _result} = insert_price_point(merchant_product_id, "0", "NULL")
    assert {:ok, _result} = insert_price_point(merchant_product_id, "0", "0")

    for {price, shipping, constraint} <- [
          {"'NaN'::numeric", "0", "price_points_price_finite_non_negative"},
          {"'Infinity'::numeric", "0", "price_points_price_finite_non_negative"},
          {"0", "'NaN'::numeric", "price_points_shipping_finite_non_negative"},
          {"0", "'Infinity'::numeric", "price_points_shipping_finite_non_negative"}
        ] do
      assert_check_violation(insert_price_point(merchant_product_id, price, shipping), constraint)
    end
  end

  test "price watch target sources reject non-finite amounts before alert capture" do
    %{id: user_id} = AccountsFixtures.user_fixture()
    %{id: product_id} = SpecsFixtures.product_fixture()

    assert {:ok, _result} = insert_target_price_watch_rule(user_id, product_id, "0")

    for target_amount <- ["'NaN'::numeric", "'Infinity'::numeric"] do
      assert_check_violation(
        insert_target_price_watch_rule(user_id, product_id, target_amount),
        "price_watch_rules_target_amount_finite_non_negative"
      )
    end
  end

  test "alert events accept nullable evidence and valid numeric endpoints and reject invalid copied numeric evidence" do
    %{user_id: user_id, merchant_product_id: merchant_product_id, price_point_id: price_point_id} =
      insert_alert_event_parents!()

    assert {:ok, _result} =
             insert_alert_event(user_id, merchant_product_id, price_point_id, %{
               baseline_landed_price: "NULL",
               target_amount: "NULL",
               percentage_drop: "NULL"
             })

    assert {:ok, _result} =
             insert_alert_event(user_id, merchant_product_id, price_point_id, %{
               percentage_drop: "0.01"
             })

    assert {:ok, _result} =
             insert_alert_event(user_id, merchant_product_id, price_point_id, %{
               percentage_drop: "100"
             })

    for values <- [
          %{item_price: "-0.01"},
          %{shipping: "-0.01"},
          %{landed_price: "-0.01"},
          %{baseline_landed_price: "-0.01"},
          %{target_amount: "-0.01"},
          %{percentage_drop: "0"},
          %{percentage_drop: "100.01"},
          %{item_price: "'NaN'::numeric"},
          %{shipping: "'NaN'::numeric"},
          %{landed_price: "'NaN'::numeric"},
          %{baseline_landed_price: "'NaN'::numeric"},
          %{target_amount: "'NaN'::numeric"},
          %{percentage_drop: "'NaN'::numeric"},
          %{item_price: "'Infinity'::numeric"},
          %{shipping: "'Infinity'::numeric"},
          %{landed_price: "'Infinity'::numeric"},
          %{baseline_landed_price: "'Infinity'::numeric"},
          %{target_amount: "'Infinity'::numeric"},
          %{percentage_drop: "'Infinity'::numeric"}
        ] do
      assert_check_violation(
        insert_alert_event(user_id, merchant_product_id, price_point_id, values),
        "alert_events_numeric_evidence_bounds"
      )
    end
  end

  defp insert_snapshot_product! do
    %{id: user_id} = AccountsFixtures.user_fixture()

    {:ok, %{rows: [[snapshot_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO comparison_snapshots (public_token, user_id, version, captured_at, inserted_at)
        VALUES ($1, $2, 1, now(), now())
        RETURNING id
        """,
        [unique_public_token(), user_id]
      )

    {:ok, %{rows: [[snapshot_product_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO comparison_snapshot_products (
          comparison_snapshot_id, position, product_id, name, slug
        )
        VALUES ($1, 1, $2, 'Copied product', 'copied-product')
        RETURNING id
        """,
        [snapshot_id, System.unique_integer([:positive])]
      )

    snapshot_product_id
  end

  defp insert_snapshot_attribute(snapshot_product_id, position, confidence) do
    ProductCompare.Repo.query(
      """
      INSERT INTO comparison_snapshot_attributes (
        snapshot_product_id, position, attribute_id, claim_id, code, display_name,
        value_text, source_type, confidence
      )
      VALUES ($1, $2, 1, 1, 'copied_attribute', 'Copied attribute', 'value', 'user', #{confidence})
      """,
      [snapshot_product_id, position]
    )
  end

  defp insert_snapshot_offer(snapshot_product_id, position, item_price, shipping, landed_price) do
    ProductCompare.Repo.query(
      """
      INSERT INTO comparison_snapshot_offers (
        snapshot_product_id, position, merchant_product_id, price_point_id, merchant_name,
        currency_id, item_price, shipping, landed_price, observed_at, freshness
      )
      VALUES ($1, $2, 1, 1, 'Copied merchant', 840, #{item_price}, #{shipping}, #{landed_price}, now(), 'fresh')
      """,
      [snapshot_product_id, position]
    )
  end

  defp insert_snapshot_recommendation! do
    snapshot_product_id = insert_snapshot_product!()

    {:ok, %{rows: [[snapshot_id]]}} =
      ProductCompare.Repo.query(
        "SELECT comparison_snapshot_id FROM comparison_snapshot_products WHERE id = $1",
        [snapshot_product_id]
      )

    {:ok, %{rows: [[snapshot_recommendation_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO comparison_snapshot_recommendations (
          comparison_snapshot_id, profile, recommendation_algorithm_id, evaluated_at, status,
          currency_id
        )
        VALUES ($1, 'lowest_current_cost', 1, now(), 'winner', 840)
        RETURNING id
        """,
        [snapshot_id]
      )

    snapshot_recommendation_id
  end

  defp insert_snapshot_ranking(snapshot_recommendation_id, rank, landed_price) do
    ProductCompare.Repo.query(
      """
      INSERT INTO comparison_snapshot_rankings (
        snapshot_recommendation_id, rank, product_id, product_name, landed_price, currency_id,
        price_point_id, merchant_product_id
      )
      VALUES ($1, $2, 1, 'Copied product', #{landed_price}, 840, 1, 1)
      """,
      [snapshot_recommendation_id, rank]
    )
  end

  defp insert_price_watch_rule(user_id, product_id, baseline_landed_price) do
    ProductCompare.Repo.query(
      """
      INSERT INTO price_watch_rules (
        user_id, product_id, rule_type, currency_id, percentage_drop, baseline_landed_price,
        inserted_at, updated_at
      )
      VALUES ($1, $2, 'percentage_drop', 840, 100, #{baseline_landed_price}, now(), now())
      """,
      [user_id, product_id]
    )
  end

  defp insert_price_watch_rule_without_baseline(user_id, product_id) do
    insert_target_price_watch_rule(user_id, product_id, "0")
  end

  defp insert_target_price_watch_rule(user_id, product_id, target_amount) do
    ProductCompare.Repo.query(
      """
      INSERT INTO price_watch_rules (
        user_id, product_id, rule_type, currency_id, target_amount, baseline_landed_price,
        inserted_at, updated_at
      )
      VALUES ($1, $2, 'target_price', 840, #{target_amount}, NULL, now(), now())
      """,
      [user_id, product_id]
    )
  end

  defp insert_price_point(merchant_product_id, price, shipping) do
    ProductCompare.Repo.query(
      """
      INSERT INTO price_points (
        merchant_product_id, observed_at, price, shipping, in_stock, inserted_at
      )
      VALUES ($1, now(), #{price}, #{shipping}, true, now())
      """,
      [merchant_product_id]
    )
  end

  defp insert_alert_event_parents! do
    %{id: user_id} = AccountsFixtures.user_fixture()
    %{id: product_id} = SpecsFixtures.product_fixture()

    {:ok, %{rows: [[merchant_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO merchants (name, domain, slug, inserted_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        RETURNING id
        """,
        [
          "Captured numeric evidence merchant #{System.unique_integer([:positive])}",
          "captured-numeric-evidence.example",
          "captured-numeric-evidence-merchant-#{System.unique_integer([:positive])}"
        ]
      )

    {:ok, %{rows: [[merchant_product_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO merchant_products (
          merchant_id, product_id, url, currency_id, inserted_at, updated_at
        )
        VALUES ($1, $2, $3, 840, now(), now())
        RETURNING id
        """,
        [
          merchant_id,
          product_id,
          "https://captured-numeric-evidence.example/#{System.unique_integer([:positive])}"
        ]
      )

    {:ok, %{rows: [[price_point_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO price_points (
          merchant_product_id, price, shipping, in_stock, inserted_at
        )
        VALUES ($1, 0, 0, true, now())
        RETURNING id
        """,
        [merchant_product_id]
      )

    %{user_id: user_id, merchant_product_id: merchant_product_id, price_point_id: price_point_id}
  end

  defp insert_alert_event(user_id, merchant_product_id, price_point_id, overrides) do
    values = Map.merge(alert_event_defaults(), overrides)

    ProductCompare.Repo.query(
      """
      INSERT INTO alert_events (
        user_id, triggering_price_point_id, merchant_product_id, rule_type, currency_id,
        item_price, shipping, landed_price, observed_at, baseline_landed_price, target_amount,
        percentage_drop, inserted_at
      )
      VALUES ($1, $2, $3, 'percentage_drop', 840, #{values.item_price}, #{values.shipping},
        #{values.landed_price}, now(), #{values.baseline_landed_price}, #{values.target_amount},
        #{values.percentage_drop}, now())
      """,
      [user_id, price_point_id, merchant_product_id]
    )
  end

  defp alert_event_defaults do
    %{
      item_price: "0",
      shipping: "0",
      landed_price: "0",
      baseline_landed_price: "0",
      target_amount: "0",
      percentage_drop: "1"
    }
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end

  defp unique_public_token do
    System.unique_integer([:positive])
    |> Integer.to_string()
    |> String.pad_leading(43, "a")
  end
end
