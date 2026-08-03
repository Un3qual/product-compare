defmodule ProductCompare.Ingestion.FeedCandidatesTest do
  use ExUnit.Case, async: true

  alias ProductCompare.ReferenceData
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Reference.ReferenceCode

  test "merchant-feed markets preserve supported IDs while rejecting unsupported standards" do
    country_type = MerchantFeedCandidate.__schema__(:type, :advertiser_country)
    language_type = MerchantFeedCandidate.__schema__(:type, :language)

    assert {:ok, "CA"} = ReferenceData.canonical_territory(" ca ")
    assert "CA" = MerchantFeedCandidate.normalize_country(" ca ")
    assert {:ok, 124} = Ecto.Type.dump(country_type, " ca ")

    assert {:ok, "US"} = ReferenceData.canonical_territory(" us ")
    assert "US" = MerchantFeedCandidate.normalize_country(" us ")
    assert {:ok, 840} = Ecto.Type.dump(country_type, " us ")

    assert {:ok, "en"} = ReferenceData.canonical_language(" en ")
    assert "EN" = MerchantFeedCandidate.normalize_language(" en ")
    assert {:ok, 1} = Ecto.Type.dump(language_type, " en ")

    assert {:ok, "fr"} = ReferenceData.canonical_language(" fr ")
    assert "FR" = MerchantFeedCandidate.normalize_language(" fr ")
    assert {:ok, 2} = Ecto.Type.dump(language_type, " fr ")

    assert {:ok, "GB"} = ReferenceData.canonical_territory(" gb ")
    assert nil == MerchantFeedCandidate.normalize_country(" gb ")
    assert :error = Ecto.Type.cast(country_type, " gb ")
    assert :error = Ecto.Type.dump(country_type, " gb ")

    assert {:ok, "de"} = ReferenceData.canonical_language(" de ")
    assert nil == MerchantFeedCandidate.normalize_language(" de ")
    assert :error = Ecto.Type.cast(language_type, " de ")
    assert :error = Ecto.Type.dump(language_type, " de ")

    assert :error = ReferenceData.canonical_territory("Canada")
    assert nil == MerchantFeedCandidate.normalize_country("Canada")
    assert :error = Ecto.Type.cast(country_type, "Canada")

    assert :error = ReferenceData.canonical_language("zz")
    assert nil == MerchantFeedCandidate.normalize_language("zz")
    assert :error = Ecto.Type.cast(language_type, "zz")
  end

  test "only country and language codes opt into CLDR validation" do
    country_type = MerchantFeedCandidate.__schema__(:type, :advertiser_country)
    language_type = MerchantFeedCandidate.__schema__(:type, :language)
    feed_type = MerchantFeedCandidate.__schema__(:type, :source_feed_type)

    assert {:parameterized, {ReferenceCode, %{standard: :territory}}} = country_type
    assert {:parameterized, {ReferenceCode, %{standard: :language}}} = language_type
    assert {:parameterized, {ReferenceCode, %{standard: :none}}} = feed_type

    assert "SHOPPING" == MerchantFeedCandidate.normalize_feed_type(" shopping ")
    assert {:ok, "SHOPPING"} = Ecto.Type.cast(feed_type, " shopping ")
    assert {:ok, 1} = Ecto.Type.dump(feed_type, " shopping ")

    application_code =
      ReferenceCode.init(codes: %{"ZZ" => 1}, normalization: :upper)

    assert {:ok, "ZZ"} = ReferenceCode.cast(" zz ", application_code)

    territory_code =
      ReferenceCode.init(codes: %{"ZZ" => 1}, normalization: :upper, standard: :territory)

    assert :error = ReferenceCode.cast(" zz ", territory_code)
  end
end
