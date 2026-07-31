defmodule ProductCompare.Repo.ReferenceCodeCodecParityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.{Evidence, Recommendation}
  alias ProductCompareSchemas.Ingestion.{ImportRun, MerchantFeedCandidate}
  alias ProductCompareSchemas.Reference.{CurrencyCode, ReferenceCode}
  alias ProductCompareSchemas.Specs.Source

  @reference_code_fields [
    {AffiliateProgram, :status, "affiliate_program_statuses"},
    {Source, :kind, "source_kinds"},
    {Source, :provider, "integration_providers"},
    {Evidence, :source_kind, "source_kinds"},
    {Recommendation, :algorithm_version, "recommendation_algorithms"},
    {ImportRun, :surface, "integration_surfaces"},
    {MerchantFeedCandidate, :advertiser_country, "countries"},
    {MerchantFeedCandidate, :source_feed_type, "provider_feed_types"},
    {MerchantFeedCandidate, :language, "languages"}
  ]

  test "every parameterized reference-code map matches its seeded table" do
    Enum.each(@reference_code_fields, fn {schema, field, table} ->
      type = schema.__schema__(:type, field)

      assert {:parameterized, {ReferenceCode, %{codes: codec_codes}}} = type
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
      |> Enum.map(fn {schema, field, _table} -> {schema, field} end)
      |> Enum.sort()

    assert expected_fields == production_reference_code_fields()
  end

  test "the currency codec round-trips the complete seeded currency table" do
    database_codes = reference_rows("currencies")

    assert database_codes == %{
             "CAD" => 124,
             "GBP" => 826,
             "USD" => 840,
             "EUR" => 978
           }

    Enum.each(database_codes, fn {code, id} ->
      assert {:ok, ^id} = CurrencyCode.dump(code)
      assert {:ok, ^code} = CurrencyCode.load(id)
    end)
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
