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

  describe "propose_claim/4 numeric range handling" do
    test "rejects conflicting base and unit-space range bounds" do
      length_dimension = SpecsFixtures.dimension_fixture(%{code: "length_for_conflict_range"})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: length_dimension,
          code: "in_for_conflict_range",
          multiplier_to_base: Decimal.new("25.4"),
          offset_to_base: Decimal.new("0")
        })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "diagonal_with_conflict_range",
          display_name: "Diagonal",
          data_type: :numeric,
          dimension_id: length_dimension.id
        })

      product = SpecsFixtures.product_fixture(%{slug: "range-conflict-product"})

      assert {:error, {:conflicting_numeric_range_bound, :value_num_base_min, :value_num_min}} =
               Specs.propose_claim(
                 product.id,
                 attribute.id,
                 %{
                   value_num: Decimal.new("27"),
                   unit_id: inch_unit.id,
                   value_num_base_min: Decimal.new("600"),
                   value_num_min: Decimal.new("24")
                 },
                 %{source_type: :user}
               )
    end

    test "normalizes numeric range bounds using the provided unit" do
      length_dimension = SpecsFixtures.dimension_fixture(%{code: "length_for_range"})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: length_dimension,
          code: "in_for_range",
          multiplier_to_base: Decimal.new("25.4"),
          offset_to_base: Decimal.new("0")
        })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "diagonal_with_range",
          display_name: "Diagonal",
          data_type: :numeric,
          dimension_id: length_dimension.id
        })

      product = SpecsFixtures.product_fixture(%{slug: "range-normalization-product"})

      assert {:ok, claim} =
               Specs.propose_claim(
                 product.id,
                 attribute.id,
                 %{
                   value_num: Decimal.new("27"),
                   unit_id: inch_unit.id,
                   value_num_min: Decimal.new("24"),
                   value_num_max: Decimal.new("30")
                 },
                 %{source_type: :user}
               )

      assert Decimal.equal?(claim.value_num_base_min, Decimal.new("609.6"))
      assert Decimal.equal?(claim.value_num_base_max, Decimal.new("762"))
    end

    test "rejects numeric claims when normalized range min exceeds max" do
      length_dimension = SpecsFixtures.dimension_fixture(%{code: "length_for_bad_range"})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: length_dimension,
          code: "in_for_bad_range",
          multiplier_to_base: Decimal.new("25.4"),
          offset_to_base: Decimal.new("0")
        })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "diagonal_with_bad_range",
          display_name: "Diagonal",
          data_type: :numeric,
          dimension_id: length_dimension.id
        })

      product = SpecsFixtures.product_fixture(%{slug: "range-invalid-product"})

      assert {:error, :invalid_numeric_range} =
               Specs.propose_claim(
                 product.id,
                 attribute.id,
                 %{
                   value_num: Decimal.new("27"),
                   unit_id: inch_unit.id,
                   value_num_min: Decimal.new("30"),
                   value_num_max: Decimal.new("24")
                 },
                 %{source_type: :user}
               )
    end
  end
end
