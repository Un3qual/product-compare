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

  describe "next_cursor/2" do
    test "accepts only nil or non-negative cursor transitions from successful reports" do
      assert OptionNormalization.next_cursor(40, {:ok, %{next_cursor: 80}}) == 80
      assert OptionNormalization.next_cursor(40, {:ok, %{next_cursor: nil}}) == nil

      for invalid_cursor <- [-1, 1.5, "80", %{value: 80}] do
        assert OptionNormalization.next_cursor(40, {:ok, %{next_cursor: invalid_cursor}}) == 40
      end
    end

    test "keeps the current cursor for errors and unexpected results" do
      assert OptionNormalization.next_cursor(40, {:error, :provider_failure}) == 40
      assert OptionNormalization.next_cursor(40, :unexpected) == 40
    end
  end
end
