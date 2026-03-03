defmodule ProductCompare.Specs.UnitConversionTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Specs
  alias ProductCompare.Specs.UnitConversion
  alias ProductCompare.Fixtures.SpecsFixtures

  describe "convert_to_base/2" do
    test "converts multiplier-only units to base values" do
      length_dimension = SpecsFixtures.dimension_fixture(%{code: "length"})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: length_dimension,
          code: "in",
          multiplier_to_base: Decimal.new("25.4"),
          offset_to_base: Decimal.new("0")
        })

      assert {:ok, converted} = Specs.convert_to_base(Decimal.new("27"), inch_unit.id)
      assert Decimal.equal?(converted, Decimal.new("685.8"))
    end

    test "supports offset conversions" do
      temperature_dimension = SpecsFixtures.dimension_fixture(%{code: "temperature"})

      fahrenheit_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: temperature_dimension,
          code: "fahrenheit",
          multiplier_to_base: Decimal.new("1.8"),
          offset_to_base: Decimal.new("32")
        })

      converted = UnitConversion.to_base(Decimal.new("0"), fahrenheit_unit)
      assert Decimal.equal?(converted, Decimal.new("32"))
    end

    test "rejects numeric claims with mismatched unit dimensions" do
      length_dimension = SpecsFixtures.dimension_fixture(%{code: "length_for_mismatch"})
      frequency_dimension = SpecsFixtures.dimension_fixture(%{code: "frequency_for_mismatch"})

      hz_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: frequency_dimension,
          code: "hz_for_mismatch",
          multiplier_to_base: Decimal.new("1"),
          offset_to_base: Decimal.new("0")
        })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "diagonal_mismatch",
          display_name: "Diagonal",
          data_type: :numeric,
          dimension_id: length_dimension.id
        })

      product = SpecsFixtures.product_fixture()

      assert {:error, :unit_dimension_mismatch} =
               Specs.propose_claim(
                 product.id,
                 attribute.id,
                 %{value_num: Decimal.new("27"), unit_id: hz_unit.id},
                 %{source_type: :user}
               )
    end
  end
end
