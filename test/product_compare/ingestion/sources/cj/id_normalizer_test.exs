defmodule ProductCompare.Ingestion.Sources.CJ.IdNormalizerTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Ingestion.Sources.CJ.IdNormalizer

  describe "normalize_id/1" do
    test "trims strings, maps blanks to nil, and coerces integers" do
      assert IdNormalizer.normalize_id(" feed-1 ") == "feed-1"
      assert IdNormalizer.normalize_id(" \t ") == nil
      assert IdNormalizer.normalize_id(123) == "123"
      assert IdNormalizer.normalize_id(:unsupported) == nil
    end
  end

  describe "normalize_ids/1" do
    test "normalizes scalar and list IDs and maps empty lists to nil" do
      assert IdNormalizer.normalize_ids(" feed-1 ") == ["feed-1"]
      assert IdNormalizer.normalize_ids(123) == ["123"]
      assert IdNormalizer.normalize_ids([" feed-1 ", "", 456, nil]) == ["feed-1", "456"]
      assert IdNormalizer.normalize_ids([" ", nil]) == nil
      assert IdNormalizer.normalize_ids(nil) == nil
    end
  end

  describe "blank_to_nil/1" do
    test "trims strings and leaves non-strings unchanged" do
      assert IdNormalizer.blank_to_nil(" value ") == "value"
      assert IdNormalizer.blank_to_nil("\n") == nil
      assert IdNormalizer.blank_to_nil(123) == 123
    end
  end
end
