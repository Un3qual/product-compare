defmodule ProductCompare.Ingestion.ScheduledCursorTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.ScheduledCursor

  test "product cursor advances from the latest completed durable import run" do
    source = source_fixture()

    {:ok, run} =
      Ingestion.start_import_run(%{
        source_id: source.id,
        provider: "cj",
        surface: "shoppingProducts",
        query: %{
          "currency" => "USD",
          "keywords" => ["shoe"],
          "serviceableAreas" => ["US"]
        },
        cursor_start: 40,
        page_size: 25,
        pages_requested: 1
      })

    assert {:ok, _run} =
             Ingestion.complete_import_run(run, %{
               status: "succeeded",
               cursor_end: 80,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 1,
               records_persisted: 1,
               records_failed: 0
             })

    assert ScheduledCursor.product(
             currency: "USD",
             keywords: ["shoe"],
             serviceable_areas: ["US"],
             cursor: 40
           ) == 80
  end

  test "feed cursor resets after the latest durable import reaches the end" do
    source = source_fixture()

    {:ok, run} =
      Ingestion.start_import_run(%{
        source_id: source.id,
        provider: "cj",
        surface: "shoppingProductFeeds",
        query: %{"advertiserCountry" => "US"},
        cursor_start: 40,
        page_size: 25,
        pages_requested: 1
      })

    assert {:ok, _run} =
             Ingestion.complete_import_run(run, %{
               status: "succeeded",
               cursor_end: nil,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 0,
               records_persisted: 1,
               records_failed: 0
             })

    assert ScheduledCursor.feed(advertiser_country: "US", cursor: 40) == nil
  end

  test "failed durable imports retry from their starting cursor" do
    source = source_fixture()

    {:ok, run} =
      Ingestion.start_import_run(%{
        source_id: source.id,
        provider: "cj",
        surface: "shoppingProducts",
        query: %{
          "currency" => "USD",
          "keywords" => ["shoe"],
          "serviceableAreas" => ["US"]
        },
        cursor_start: 40,
        page_size: 25,
        pages_requested: 1
      })

    assert {:ok, _run} =
             Ingestion.complete_import_run(run, %{
               status: "failed",
               cursor_end: 80,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 1,
               records_persisted: 1,
               records_failed: 1
             })

    assert ScheduledCursor.product(
             currency: "USD",
             keywords: ["shoe"],
             serviceable_areas: ["US"],
             cursor: 0
           ) == 40
  end

  test "complete-scope jobs do not stitch reconciliation across scheduled runs" do
    source = source_fixture()

    {:ok, run} =
      Ingestion.start_import_run(%{
        complete_scope: true,
        source_id: source.id,
        provider: "cj",
        surface: "shoppingProducts",
        query: %{
          "currency" => "USD",
          "keywords" => ["shoe"],
          "serviceableAreas" => ["US"]
        },
        cursor_start: 0,
        page_size: 25,
        pages_requested: 1
      })

    assert {:ok, _run} =
             Ingestion.complete_import_run(run, %{
               status: "succeeded",
               cursor_end: 80,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 1,
               records_persisted: 1,
               records_failed: 0
             })

    assert ScheduledCursor.product(
             complete_scope: true,
             currency: "USD",
             keywords: ["shoe"],
             serviceable_areas: ["US"],
             cursor: nil
           ) == nil
  end
end
