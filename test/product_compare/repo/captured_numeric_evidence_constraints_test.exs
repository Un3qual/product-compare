defmodule ProductCompare.Repo.CapturedNumericEvidenceConstraintsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Attribute, as: SnapshotAttribute
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Offer, as: SnapshotOffer
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Ranking, as: SnapshotRanking
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Taxonomy.ProductTaxon

  test "snapshot attribute changesets reject confidence outside the database range" do
    attrs = %{
      snapshot_product_id: 1,
      position: 1,
      attribute_id: 1,
      claim_id: 1,
      code: "weight",
      display_name: "Weight",
      value_text: "1 kg",
      source_type: :user,
      confidence: Decimal.new(0)
    }

    assert SnapshotAttribute.changeset(%SnapshotAttribute{}, attrs).valid?
    assert SnapshotAttribute.changeset(%SnapshotAttribute{}, %{attrs | confidence: nil}).valid?

    for confidence <- [
          Decimal.new("-0.01"),
          Decimal.new("1.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        SnapshotAttribute.changeset(%SnapshotAttribute{}, %{attrs | confidence: confidence}),
        :confidence
      )
    end
  end

  test "snapshot offer changesets reject every invalid copied amount" do
    attrs = %{
      snapshot_product_id: 1,
      position: 1,
      merchant_product_id: 1,
      price_point_id: 1,
      merchant_name: "Merchant",
      currency: "USD",
      item_price: Decimal.new(0),
      shipping: Decimal.new(0),
      landed_price: Decimal.new(0),
      observed_at: ~U[2026-08-09 12:00:00Z],
      freshness: :fresh
    }

    assert SnapshotOffer.changeset(%SnapshotOffer{}, attrs).valid?

    for field <- [:item_price, :shipping, :landed_price],
        amount <- [
          Decimal.new("-0.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        SnapshotOffer.changeset(%SnapshotOffer{}, Map.put(attrs, field, amount)),
        field
      )
    end
  end

  test "snapshot ranking changesets reject invalid copied landed prices" do
    attrs = %{
      snapshot_recommendation_id: 1,
      rank: 1,
      product_id: 1,
      product_name: "Product",
      landed_price: Decimal.new(0),
      currency: "USD",
      price_point_id: 1,
      merchant_product_id: 1,
      claim_ids: [1],
      reasons: ["Lowest current cost"]
    }

    assert SnapshotRanking.changeset(%SnapshotRanking{}, attrs).valid?

    for landed_price <- [
          Decimal.new("-0.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        SnapshotRanking.changeset(%SnapshotRanking{}, %{attrs | landed_price: landed_price}),
        :landed_price
      )
    end
  end

  test "alert event changesets reject copied numeric evidence outside database bounds" do
    attrs = %{
      watch_rule_id: 1,
      user_id: 1,
      triggering_price_point_id: 1,
      merchant_product_id: 1,
      rule_type: :percentage_drop,
      currency: "USD",
      item_price: Decimal.new(0),
      shipping: Decimal.new(0),
      landed_price: Decimal.new(0),
      observed_at: ~U[2026-08-09 12:00:00Z],
      baseline_landed_price: nil,
      target_amount: nil,
      percentage_drop: nil
    }

    assert AlertEvent.changeset(%AlertEvent{}, attrs).valid?

    for field <- [
          :item_price,
          :shipping,
          :landed_price,
          :baseline_landed_price,
          :target_amount
        ],
        amount <- [
          Decimal.new("-0.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        AlertEvent.changeset(%AlertEvent{}, Map.put(attrs, field, amount)),
        field
      )
    end

    for percentage_drop <- [
          Decimal.new(0),
          Decimal.new("100.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        AlertEvent.changeset(%AlertEvent{}, %{attrs | percentage_drop: percentage_drop}),
        :percentage_drop
      )
    end
  end

  test "price watch creation rejects invalid captured baselines before SQL" do
    attrs = %{
      user_id: 1,
      product_id: 1,
      rule_type: :percentage_drop,
      currency: "USD",
      percentage_drop: Decimal.new(10),
      baseline_landed_price: Decimal.new(0)
    }

    assert PriceWatchRule.create_changeset(%PriceWatchRule{}, attrs).valid?

    for baseline <- [
          Decimal.new("-0.01"),
          Decimal.new("NaN"),
          Decimal.new("Infinity"),
          Decimal.new("-Infinity")
        ] do
      assert_invalid_field(
        PriceWatchRule.create_changeset(%PriceWatchRule{}, %{
          attrs
          | baseline_landed_price: baseline
        }),
        :baseline_landed_price
      )
    end
  end

  test "price watch changesets reject non-finite percentage drops before SQL" do
    attrs = %{
      user_id: 1,
      product_id: 1,
      rule_type: :percentage_drop,
      currency: "USD",
      percentage_drop: Decimal.new(10),
      baseline_landed_price: Decimal.new(100)
    }

    watch = struct!(PriceWatchRule, Map.put(attrs, :id, 1))

    for percentage_drop <- non_finite_decimals() do
      assert_invalid_field(
        PriceWatchRule.create_changeset(%PriceWatchRule{}, %{
          attrs
          | percentage_drop: percentage_drop
        }),
        :percentage_drop
      )

      assert_invalid_field(
        PriceWatchRule.update_changeset(watch, %{percentage_drop: percentage_drop}),
        :percentage_drop
      )
    end
  end

  test "mapped confidence changesets reject non-finite Decimals before SQL" do
    claim_attrs = %{
      product_id: 1,
      attribute_id: 1,
      source_type: :user,
      status: :proposed,
      value_text: "value",
      confidence: Decimal.new(1)
    }

    product_taxon_attrs = %{
      product_id: 1,
      taxon_id: 1,
      source_type: :user,
      confidence: Decimal.new(1)
    }

    for confidence <- non_finite_decimals() do
      assert_invalid_field(
        ProductAttributeClaim.changeset(%ProductAttributeClaim{}, %{
          claim_attrs
          | confidence: confidence
        }),
        :confidence
      )

      assert_invalid_field(
        ProductTaxon.changeset(%ProductTaxon{}, %{
          product_taxon_attrs
          | confidence: confidence
        }),
        :confidence
      )
    end
  end

  test "captured numeric changesets map their exact database checks" do
    assert_maps_check(
      SnapshotAttribute.changeset(%SnapshotAttribute{}, %{}),
      "comparison_snapshot_attributes_confidence_range"
    )

    assert_maps_check(
      SnapshotOffer.changeset(%SnapshotOffer{}, %{}),
      "comparison_snapshot_offers_amounts_non_negative"
    )

    assert_maps_check(
      SnapshotRanking.changeset(%SnapshotRanking{}, %{}),
      "comparison_snapshot_rankings_landed_price_non_negative"
    )

    assert_maps_check(
      AlertEvent.changeset(%AlertEvent{}, %{}),
      "alert_events_numeric_evidence_bounds"
    )

    assert_maps_check(
      PriceWatchRule.create_changeset(%PriceWatchRule{}, %{}),
      "price_watch_rules_baseline_landed_price_non_negative"
    )
  end

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

  test "price points retain only the canonical finite non-negative amount checks" do
    assert active_check_names("price_points") == [
             "price_points_price_finite_non_negative",
             "price_points_shipping_finite_non_negative"
           ]
  end

  test "price point changesets return field errors for non-finite Decimal inputs" do
    %{merchant_product_id: merchant_product_id} = insert_alert_event_parents!()

    for field <- [:price, :shipping], non_finite <- non_finite_decimals() do
      attrs =
        %{
          merchant_product_id: merchant_product_id,
          observed_at: DateTime.utc_now(),
          price: Decimal.new(0),
          shipping: Decimal.new(0)
        }
        |> Map.put(field, non_finite)

      assert {:error, changeset} =
               %PricePoint{}
               |> PricePoint.changeset(attrs)
               |> Repo.insert()

      assert_decimal_cast_error(changeset, field)
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

  test "price watch changesets return field errors for non-finite Decimal inputs" do
    %{id: user_id} = AccountsFixtures.user_fixture()
    %{id: product_id} = SpecsFixtures.product_fixture()

    base_create_attrs = %{
      user_id: user_id,
      product_id: product_id,
      rule_type: :target_price,
      currency: "USD",
      target_amount: Decimal.new(0)
    }

    for non_finite <- non_finite_decimals() do
      assert {:error, create_changeset} =
               %PriceWatchRule{}
               |> PriceWatchRule.create_changeset(%{
                 base_create_attrs
                 | target_amount: non_finite
               })
               |> Repo.insert()

      assert_decimal_cast_error(create_changeset, :target_amount)
    end

    {:ok, watch} =
      %PriceWatchRule{}
      |> PriceWatchRule.create_changeset(base_create_attrs)
      |> Repo.insert()

    for non_finite <- non_finite_decimals() do
      assert {:error, update_changeset} =
               watch
               |> PriceWatchRule.update_changeset(%{target_amount: non_finite})
               |> Repo.update()

      assert_decimal_cast_error(update_changeset, :target_amount)
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

  defp active_check_names(table) do
    %{rows: rows} =
      Repo.query!(
        """
        SELECT constraint_record.conname
        FROM pg_constraint AS constraint_record
        JOIN pg_class AS table_record
          ON table_record.oid = constraint_record.conrelid
        JOIN pg_namespace AS namespace_record
          ON namespace_record.oid = table_record.relnamespace
        WHERE namespace_record.nspname = current_schema()
          AND table_record.relname = $1
          AND constraint_record.contype = 'c'
        ORDER BY constraint_record.conname
        """,
        [table]
      )

    Enum.map(rows, &hd/1)
  end

  defp assert_decimal_cast_error(changeset, field) do
    assert {"is invalid", [type: :decimal, validation: :cast]} =
             Keyword.fetch!(changeset.errors, field)
  end

  defp assert_invalid_field(changeset, field) do
    refute changeset.valid?
    assert Keyword.has_key?(changeset.errors, field)
  end

  defp assert_maps_check(changeset, constraint) do
    assert Enum.any?(Ecto.Changeset.constraints(changeset), fn mapping ->
             mapping.type == :check and mapping.constraint == constraint
           end)
  end

  defp non_finite_decimals,
    do: [Decimal.new("NaN"), Decimal.new("Infinity"), Decimal.new("-Infinity")]

  defp unique_public_token do
    System.unique_integer([:positive])
    |> Integer.to_string()
    |> String.pad_leading(43, "a")
  end
end
