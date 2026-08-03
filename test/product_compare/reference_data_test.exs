defmodule ProductCompare.ReferenceDataTest do
  use ExUnit.Case, async: true

  alias ProductCompare.ReferenceData

  describe "standards recognition" do
    test "canonicalizes supported currency, territory, and language codes" do
      assert {:ok, "USD"} = ReferenceData.canonical_currency(" usd ")
      assert {:ok, "CA"} = ReferenceData.canonical_territory("ca")
      assert {:ok, "fr"} = ReferenceData.canonical_language("fr")
    end

    test "recognizes valid standard codes outside ProductCompare support" do
      assert {:ok, "AUD"} = ReferenceData.canonical_currency("aud")
      refute ReferenceData.supported_currency?("aud")

      assert {:ok, "GB"} = ReferenceData.canonical_territory("gb")
      refute ReferenceData.supported_territory?("gb")

      assert {:ok, "de"} = ReferenceData.canonical_language("de")
      refute ReferenceData.supported_language?("de")
    end

    test "recognizes ProductCompare-supported codes as supported" do
      assert ReferenceData.supported_currency?(" usd ")
      assert ReferenceData.supported_territory?("ca")
      assert ReferenceData.supported_language?("fr")
    end

    test "normalizes malformed and unknown codes without raising" do
      assert :error = ReferenceData.canonical_currency("US")
      assert :error = ReferenceData.canonical_territory("Canada")
      assert :error = ReferenceData.canonical_language("zz")

      refute ReferenceData.supported_currency?(nil)
      refute ReferenceData.supported_territory?(:ca)
      refute ReferenceData.supported_language?(123)
    end
  end

  describe "CLDR metadata" do
    test "returns canonical English metadata for supported reference codes" do
      assert {:ok, %{code: "USD", name: "US Dollar", minor_unit: 2}} =
               ReferenceData.currency("usd")

      assert {:ok, %{code: "CA", name: "Canada"}} = ReferenceData.territory("ca")
      assert {:ok, %{code: "fr", name: "French"}} = ReferenceData.language("fr")
    end

    test "returns nil metadata for malformed or unknown codes" do
      assert nil == ReferenceData.currency("US")
      assert nil == ReferenceData.territory("Canada")
      assert nil == ReferenceData.language("zz")
    end
  end
end
