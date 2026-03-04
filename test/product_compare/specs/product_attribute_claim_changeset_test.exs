defmodule ProductCompare.Specs.ProductAttributeClaimChangesetTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompareSchemas.Specs.ProductAttributeClaim

  describe "ProductAttributeClaim.changeset/2 typed-value invariants" do
    test "accepts exactly one typed value" do
      changeset =
        ProductAttributeClaim.changeset(
          %ProductAttributeClaim{},
          valid_attrs(%{value_bool: true})
        )

      assert changeset.valid?
    end

    test "rejects claims with no typed value" do
      changeset = ProductAttributeClaim.changeset(%ProductAttributeClaim{}, valid_attrs(%{}))

      refute changeset.valid?
      assert "must contain exactly one typed value" in errors_on(changeset).base
    end

    test "rejects claims with multiple typed values" do
      changeset =
        ProductAttributeClaim.changeset(
          %ProductAttributeClaim{},
          valid_attrs(%{value_bool: true, value_text: "extra"})
        )

      refute changeset.valid?
      assert "must contain exactly one typed value" in errors_on(changeset).base
    end

    test "requires unit and base numeric value when numeric claim is present" do
      changeset =
        ProductAttributeClaim.changeset(
          %ProductAttributeClaim{},
          valid_attrs(%{value_num: Decimal.new("27")})
        )

      refute changeset.valid?
      assert "must be present when value_num is set" in errors_on(changeset).unit_id
      assert "must be present when value_num is set" in errors_on(changeset).value_num_base
    end

    test "rejects numeric ranges where min is greater than max" do
      changeset =
        ProductAttributeClaim.changeset(
          %ProductAttributeClaim{},
          valid_attrs(%{
            value_num: Decimal.new("27"),
            unit_id: 10,
            value_num_base: Decimal.new("685.8"),
            value_num_base_min: Decimal.new("700"),
            value_num_base_max: Decimal.new("600")
          })
        )

      refute changeset.valid?

      assert "must be less than or equal to value_num_base_max" in errors_on(changeset).value_num_base_min
    end
  end

  defp valid_attrs(extra) do
    Map.merge(
      %{
        product_id: 1,
        attribute_id: 2,
        source_type: :user,
        status: :proposed
      },
      extra
    )
  end
end
