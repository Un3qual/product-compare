defmodule ProductCompareSchemas.DecimalInputTest do
  use ExUnit.Case, async: true

  alias ProductCompareSchemas.DecimalInput

  describe "to_decimal/1" do
    test "preserves supported decimal input forms" do
      decimal = Decimal.new("12.34")

      assert DecimalInput.to_decimal(decimal) == decimal
      assert Decimal.equal?(DecimalInput.to_decimal(12), Decimal.new("12"))
      assert Decimal.equal?(DecimalInput.to_decimal(12.5), Decimal.from_float(12.5))
      assert Decimal.equal?(DecimalInput.to_decimal("12.34"), Decimal.new("12.34"))
      assert Decimal.equal?(DecimalInput.to_decimal("1e2"), Decimal.new("1E+2"))
    end

    test "returns nil for malformed decimal strings" do
      assert DecimalInput.to_decimal("") == nil
      assert DecimalInput.to_decimal("abc") == nil
      assert DecimalInput.to_decimal("12.34abc") == nil
    end
  end
end
