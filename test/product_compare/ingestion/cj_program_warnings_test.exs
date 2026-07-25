defmodule ProductCompare.Ingestion.CJProgramWarningsTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]
  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJProgramWarnings
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  test "program warnings aggregate factual feed gaps once in deterministic code order" do
    source = source_fixture()

    first_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "warning-program",
        advertiser_country: "CA",
        advertiser_name: nil,
        currency: "USD",
        language: "EN",
        product_count: 4,
        raw_metadata: %{
          "account_id" => "do-not-return",
          "tracking_params" => %{"sid" => "do-not-return"}
        }
      })

    program = Repo.get!(CJProgram, first_feed.cj_program_id)

    _second_feed =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: "warning-program",
        advertiser_country: "US",
        advertiser_name: "Present advertiser",
        currency: "CAD",
        language: "FR",
        product_count: 0,
        raw_metadata: %{"provider_payload" => "do-not-return"}
      })

    {warnings_by_program, queries} =
      capture_select_queries(fn -> CJProgramWarnings.by_program_ids([program.id, program.id]) end)

    assert warnings_by_program == %{
             program.id => [
               "missing_advertiser_name",
               "missing_product_count",
               "non_us_market",
               "non_usd_currency",
               "non_english_language"
             ]
           }

    assert [_aggregate_query] = queries
  end

  test "program warnings include requested programs without gaps and skip a query for an empty request" do
    source = source_fixture()
    clean_feed = merchant_feed_candidate_fixture(source, %{advertiser_id: "clean-program"})
    clean_program = Repo.get!(CJProgram, clean_feed.cj_program_id)

    assert CJProgramWarnings.by_program_ids([clean_program.id]) == %{clean_program.id => []}

    {empty_warnings, queries} =
      capture_select_queries(fn -> CJProgramWarnings.by_program_ids([]) end)

    assert empty_warnings == %{}
    assert queries == []
  end
end
