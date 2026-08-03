defmodule ProductCompare.Repo.ReferenceCodeCodecParityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Repo
  alias ProductCompare.ReferenceData
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.{Evidence, Recommendation}
  alias ProductCompareSchemas.Ingestion.{ImportRun, MerchantFeedCandidate}
  alias ProductCompareSchemas.Reference.{CurrencyCode, ReferenceCode}
  alias ProductCompareSchemas.Specs.Source

  @reference_code_fields [
    {AffiliateProgram, :status, "affiliate_program_statuses", :none},
    {Source, :kind, "source_kinds", :none},
    {Source, :provider, "integration_providers", :none},
    {Evidence, :source_kind, "source_kinds", :none},
    {Recommendation, :algorithm_version, "recommendation_algorithms", :none},
    {ImportRun, :surface, "integration_surfaces", :none},
    {MerchantFeedCandidate, :advertiser_country, "countries", :territory},
    {MerchantFeedCandidate, :source_feed_type, "provider_feed_types", :none},
    {MerchantFeedCandidate, :language, "languages", :language}
  ]

  test "every parameterized reference-code map matches its seeded table" do
    Enum.each(@reference_code_fields, fn {schema, field, table, standard} ->
      type = schema.__schema__(:type, field)

      assert {:parameterized, {ReferenceCode, %{codes: codec_codes, standard: ^standard}}} = type
      assert codec_codes == reference_rows(table)

      Enum.each(codec_codes, fn {code, id} ->
        assert {:ok, ^id} = Ecto.Type.dump(type, code)
        assert {:ok, ^code} = Ecto.Type.load(type, id)
      end)
    end)
  end

  test "the explicit table matrix covers every production reference-code field" do
    expected_fields =
      @reference_code_fields
      |> Enum.map(fn {schema, field, _table, _standard} -> {schema, field} end)
      |> Enum.sort()

    assert expected_fields == production_reference_code_fields()
  end

  test "the currency codec preserves seeded IDs and CLDR metadata" do
    database_codes = reference_rows("currencies")

    assert database_codes == %{
             "CAD" => 124,
             "GBP" => 826,
             "USD" => 840,
             "EUR" => 978
           }

    expected_minor_units = %{
      "CAD" => 2,
      "EUR" => 2,
      "GBP" => 2,
      "USD" => 2
    }

    Enum.each(database_codes, fn {code, id} ->
      normalized_input = " #{String.downcase(code)} "
      minor_unit = Map.fetch!(expected_minor_units, code)

      assert {:ok, ^code} = ReferenceData.canonical_currency(normalized_input)

      assert {:ok, %{code: ^code, minor_unit: ^minor_unit}} =
               ReferenceData.currency(normalized_input)

      assert {:ok, ^code} = CurrencyCode.cast(normalized_input)
      assert {:ok, ^id} = CurrencyCode.dump(normalized_input)
      assert {:ok, ^code} = CurrencyCode.load(id)
    end)
  end

  test "the codec rejects CLDR-recognized currencies outside ProductCompare support" do
    assert {:ok, "JPY"} = ReferenceData.canonical_currency(" jpy ")
    assert {:ok, %{code: "JPY", minor_unit: 0}} = ReferenceData.currency(" jpy ")

    assert :error = CurrencyCode.cast(" jpy ")
    assert :error = CurrencyCode.dump(" jpy ")
  end

  defp reference_rows(table) do
    Repo.query!("SELECT code, id FROM #{table} ORDER BY id").rows
    |> Map.new(fn [code, id] -> {code, id} end)
  end

  defp production_reference_code_fields do
    :product_compare
    |> Application.spec(:modules)
    |> Enum.flat_map(fn schema ->
      if Code.ensure_loaded?(schema) and function_exported?(schema, :__schema__, 1) do
        for field <- schema.__schema__(:fields),
            match?(
              {:parameterized, {ReferenceCode, _parameters}},
              schema.__schema__(:type, field)
            ),
            do: {schema, field}
      else
        []
      end
    end)
    |> Enum.sort()
  end
end
