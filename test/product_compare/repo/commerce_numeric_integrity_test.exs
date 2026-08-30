defmodule ProductCompare.Repo.CommerceNumericIntegrityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Affiliate
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  @non_finite_decimals [
    Decimal.new("NaN"),
    Decimal.new("Infinity"),
    Decimal.new("-Infinity")
  ]

  test "commerce conversion changesets reject non-finite amounts before SQL" do
    attrs = valid_conversion_attrs()

    assert CommerceConversion.changeset(%CommerceConversion{}, attrs).valid?

    for field <- [:order_amount, :commission_amount, :commission_rate],
        amount <- @non_finite_decimals do
      assert_invalid_field(
        CommerceConversion.changeset(%CommerceConversion{}, Map.put(attrs, field, amount)),
        field
      )
    end
  end

  test "purchase price fact changesets reject non-finite prices but allow finite signed deltas" do
    attrs = valid_purchase_price_fact_attrs()

    assert PurchasePriceFact.changeset(%PurchasePriceFact{}, attrs).valid?

    assert PurchasePriceFact.changeset(
             %PurchasePriceFact{},
             %{attrs | price_delta: Decimal.new("-10.25")}
           ).valid?

    for field <- [
          :listed_price_at_click,
          :reported_paid_price,
          :shipping_amount,
          :tax_amount,
          :discount_amount,
          :observed_price,
          :price_delta
        ],
        amount <- @non_finite_decimals do
      assert_invalid_field(
        PurchasePriceFact.changeset(%PurchasePriceFact{}, Map.put(attrs, field, amount)),
        field
      )
    end
  end

  test "database rejects non-finite commerce conversion amounts" do
    affiliate_network_id = affiliate_network_id()

    for {suffix, amount} <- [{"nan", "'NaN'::numeric"}, {"infinity", "'Infinity'::numeric"}] do
      assert_check_violation(
        Repo.query(
          """
          INSERT INTO commerce_conversions (
            affiliate_network_id,
            network_conversion_ref,
            status,
            currency_id,
            order_amount,
            attribution_confidence,
            reported_at,
            raw_payload,
            inserted_at,
            updated_at
          )
          VALUES ($1, $2, 'pending', 840, #{amount}, 'unmatched', now(), '{}', now(), now())
          """,
          [affiliate_network_id, "non-finite-#{suffix}-#{System.unique_integer([:positive])}"]
        ),
        "commerce_conversions_amounts_non_negative"
      )
    end
  end

  test "database rejects non-finite purchase prices and signed deltas" do
    valid_conversion = insert_conversion!()

    assert {:ok, _result} = insert_price_fact(valid_conversion.id, "100.00", "-10.25")

    non_finite_price_conversion = insert_conversion!()

    assert_check_violation(
      insert_price_fact(non_finite_price_conversion.id, "'NaN'::numeric", "NULL"),
      "purchase_price_facts_amounts_non_negative"
    )

    for price_delta <- ["'NaN'::numeric", "'Infinity'::numeric", "'-Infinity'::numeric"] do
      other_conversion = insert_conversion!()

      assert_check_violation(
        insert_price_fact(other_conversion.id, "100.00", price_delta),
        "purchase_price_facts_price_delta_finite"
      )
    end
  end

  defp valid_conversion_attrs do
    %{
      source_network: "impact",
      affiliate_network_id: 1,
      network_conversion_ref: "conversion-ref",
      status: :pending,
      currency: "USD",
      order_amount: Decimal.new("100.00"),
      commission_amount: Decimal.new("10.00"),
      commission_rate: Decimal.new("0.10"),
      attribution_confidence: :unmatched,
      reported_at: ~U[2026-08-30 12:00:00.000000Z]
    }
  end

  defp valid_purchase_price_fact_attrs do
    %{
      conversion_id: 1,
      listed_price_at_click: Decimal.new("120.00"),
      reported_paid_price: Decimal.new("100.00"),
      shipping_amount: Decimal.new("5.00"),
      tax_amount: Decimal.new("8.00"),
      discount_amount: Decimal.new("20.00"),
      currency: "USD",
      observed_price: Decimal.new("110.25"),
      price_delta: Decimal.new("-10.25")
    }
  end

  defp insert_conversion! do
    attrs =
      valid_conversion_attrs()
      |> Map.put(:affiliate_network_id, affiliate_network_id())
      |> Map.put(
        :network_conversion_ref,
        "conversion-#{System.unique_integer([:positive])}"
      )

    %CommerceConversion{}
    |> CommerceConversion.changeset(attrs)
    |> Repo.insert!()
  end

  defp affiliate_network_id do
    {:ok, network} =
      Affiliate.upsert_network(%{
        name: "Numeric Integrity Network #{System.unique_integer([:positive])}"
      })

    network.id
  end

  defp insert_price_fact(conversion_id, reported_paid_price, price_delta) do
    Repo.query(
      """
      INSERT INTO purchase_price_facts (
        conversion_id,
        reported_paid_price,
        currency_id,
        price_delta,
        inserted_at,
        updated_at
      )
      VALUES ($1, #{reported_paid_price}, 840, #{price_delta}, now(), now())
      """,
      [conversion_id]
    )
  end

  defp assert_invalid_field(changeset, field) do
    refute changeset.valid?
    assert Map.has_key?(errors_on(changeset), field)
  end

  defp assert_check_violation(
         {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: constraint}}},
         expected_constraint
       ) do
    assert constraint == expected_constraint
  end

  defp assert_check_violation({:ok, _result}, expected_constraint) do
    flunk("expected #{expected_constraint} to reject the direct write")
  end
end
