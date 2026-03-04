defmodule ProductCompare.Specs.ProductAttributeClaimDbConstraintTest do
  use ProductCompare.DataCase, async: true

  alias Ecto.Adapters.SQL
  alias ProductCompare.Fixtures.SpecsFixtures

  describe "product_attribute_claims DB constraints" do
    test "single typed value check rejects rows with no typed value" do
      product = SpecsFixtures.product_fixture(%{slug: "pac-db-no-typed-value-product"})
      attribute = SpecsFixtures.attribute_fixture(%{code: "pac_db_no_typed_value_attr"})

      result =
        SQL.query(
          Repo,
          """
          INSERT INTO product_attribute_claims (
            product_id, attribute_id, source_type, status, inserted_at
          )
          VALUES ($1, $2, 'user', 'proposed', now())
          """,
          [product.id, attribute.id]
        )

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "product_attribute_claim_single_typed_value"}
              }} = result
    end

    test "single typed value check rejects rows with multiple typed values" do
      product = SpecsFixtures.product_fixture(%{slug: "pac-db-multi-typed-value-product"})
      attribute = SpecsFixtures.attribute_fixture(%{code: "pac_db_multi_typed_value_attr"})

      result =
        SQL.query(
          Repo,
          """
          INSERT INTO product_attribute_claims (
            product_id,
            attribute_id,
            source_type,
            status,
            value_bool,
            value_text,
            inserted_at
          )
          VALUES ($1, $2, 'user', 'proposed', true, 'conflicting', now())
          """,
          [product.id, attribute.id]
        )

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "product_attribute_claim_single_typed_value"}
              }} = result
    end

    test "confidence range check rejects out-of-range values" do
      product = SpecsFixtures.product_fixture(%{slug: "pac-db-confidence-product"})
      attribute = SpecsFixtures.attribute_fixture(%{code: "pac_db_confidence_attr"})

      result =
        SQL.query(
          Repo,
          """
          INSERT INTO product_attribute_claims (
            product_id,
            attribute_id,
            source_type,
            status,
            confidence,
            value_bool,
            inserted_at
          )
          VALUES ($1, $2, 'user', 'proposed', 1.1, true, now())
          """,
          [product.id, attribute.id]
        )

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "product_attribute_claims_confidence_range"}
              }} = result
    end
  end
end
