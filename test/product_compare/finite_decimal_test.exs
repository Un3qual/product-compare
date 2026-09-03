defmodule ProductCompareSchemas.FiniteDecimalTest do
  use ExUnit.Case, async: true

  alias ProductCompareSchemas.FiniteDecimal

  test "casts supported decimal inputs" do
    assert FiniteDecimal.cast(Decimal.new("12.34")) == {:ok, Decimal.new("12.34")}
    assert FiniteDecimal.cast("12.34") == {:ok, Decimal.new("12.34")}
    assert FiniteDecimal.cast(12) == {:ok, Decimal.new("12")}
    assert FiniteDecimal.cast(12.5) == {:ok, Decimal.from_float(12.5)}
  end

  test "returns cast errors instead of raising for Decimal special values" do
    for value <- [Decimal.new("NaN"), Decimal.new("Infinity"), Decimal.new("-Infinity")] do
      assert FiniteDecimal.cast(value) == :error
      assert FiniteDecimal.dump(value) == :error
      assert FiniteDecimal.load(value) == :error
    end
  end
end
