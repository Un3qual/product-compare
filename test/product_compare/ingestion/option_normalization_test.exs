defmodule ProductCompare.Ingestion.OptionNormalizationTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Ingestion.OptionNormalization

  describe "option/3" do
    test "looks up atom keys with string-key fallback in maps" do
      assert OptionNormalization.option(%{limit: 2}, :limit, 5) == 2
      assert OptionNormalization.option(%{"limit" => 3}, :limit, 5) == 3
    end

    test "looks up non-atom map keys without atom conversion" do
      assert OptionNormalization.option(%{"limit" => 3}, "limit", 5) == 3
      assert OptionNormalization.option(%{}, "limit", 5) == 5
    end
  end
end
