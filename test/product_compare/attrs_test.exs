defmodule ProductCompare.AttrsTest do
  use ExUnit.Case, async: true

  alias ProductCompare.Attrs

  describe "fetch/3" do
    test "reads atom keys before string keys" do
      attrs = %{"label" => "string-label", label: "atom-label"}

      assert Attrs.fetch(attrs, :label) == "atom-label"
    end

    test "reads string keys and returns defaults for missing or non-map attrs" do
      assert Attrs.fetch(%{"label" => "string-label"}, :label) == "string-label"
      assert Attrs.fetch(%{}, :label, "fallback") == "fallback"
      assert Attrs.fetch([], :label, "fallback") == "fallback"
    end

    test "reads keyword keys" do
      assert Attrs.fetch([label: "keyword-label"], :label) == "keyword-label"
      assert Attrs.fetch([label: nil], :label, "fallback") == nil
    end
  end

  describe "ensure_map/1" do
    test "preserves maps and normalizes non-map attrs to an empty map" do
      assert Attrs.ensure_map(%{label: "CLI"}) == %{label: "CLI"}
      assert Attrs.ensure_map(nil) == %{}
      assert Attrs.ensure_map([]) == %{}
    end
  end

  describe "put_present/3" do
    test "puts non-nil values and skips nil values" do
      attrs = %{existing: true}

      assert Attrs.put_present(attrs, :label, "CLI") == %{existing: true, label: "CLI"}
      assert Attrs.put_present(attrs, :label, nil) == %{existing: true}
    end
  end

  describe "has_key?/2" do
    test "detects atom and string keys even when the value is nil" do
      assert Attrs.has_key?(%{label: nil}, :label)
      assert Attrs.has_key?(%{"label" => nil}, :label)
      assert Attrs.has_key?([label: nil], :label)
      refute Attrs.has_key?(%{}, :label)
      refute Attrs.has_key?([], :label)
    end
  end

  describe "present?/2" do
    test "returns true only when atom or string key lookup returns a non-nil value" do
      assert Attrs.present?(%{label: "CLI"}, :label)
      assert Attrs.present?(%{"label" => "CLI"}, :label)
      assert Attrs.present?([label: "CLI"], :label)
      refute Attrs.present?(%{label: nil}, :label)
      refute Attrs.present?(%{"label" => nil}, :label)
      refute Attrs.present?([label: nil], :label)
      refute Attrs.present?([], :label)
    end
  end
end
