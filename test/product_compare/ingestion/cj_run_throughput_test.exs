defmodule ProductCompare.Ingestion.CJRunThroughputTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion.CJRunThroughput
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  describe "daily_summary/2" do
    test "aggregates CJ runs by UTC date and surface inside the requested window" do
      now = ~U[2026-07-02 12:00:00Z]
      source = source_fixture()

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-07-02 10:00:00Z],
        pages_fetched: 2,
        records_fetched: 20,
        records_normalized: 18,
        records_persisted: 17,
        records_failed: 1
      })

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "failed",
        started_at: ~U[2026-07-02 11:00:00Z],
        pages_fetched: 1,
        records_fetched: 5,
        records_normalized: 0,
        records_persisted: 0,
        records_failed: 5,
        error_summary: "provider payload"
      })

      import_run_fixture(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        started_at: ~U[2026-07-01 08:00:00Z],
        pages_fetched: 4,
        records_fetched: 40,
        records_normalized: 40,
        records_persisted: 39,
        records_failed: 1
      })

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-07-01 09:00:00Z],
        pages_fetched: 3,
        records_fetched: 30,
        records_normalized: 30,
        records_persisted: 30,
        records_failed: 0
      })

      import_run_fixture(source, %{
        provider: "awin",
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-07-02 09:00:00Z],
        pages_fetched: 99,
        records_fetched: 99
      })

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-06-01 09:00:00Z],
        pages_fetched: 99,
        records_fetched: 99
      })

      assert %{
               provider: "cj",
               days: 14,
               buckets: [
                 %{
                   date: ~D[2026-07-02],
                   surface: "shoppingProducts",
                   run_count: 2,
                   succeeded_run_count: 1,
                   failed_run_count: 1,
                   pages_fetched: 3,
                   records_fetched: 25,
                   records_normalized: 18,
                   records_persisted: 17,
                   records_failed: 6
                 },
                 %{
                   date: ~D[2026-07-01],
                   surface: "shoppingProductFeeds",
                   run_count: 1,
                   succeeded_run_count: 1,
                   failed_run_count: 0,
                   pages_fetched: 4,
                   records_fetched: 40,
                   records_normalized: 40,
                   records_persisted: 39,
                   records_failed: 1
                 },
                 %{
                   date: ~D[2026-07-01],
                   surface: "shoppingProducts",
                   run_count: 1,
                   succeeded_run_count: 1,
                   failed_run_count: 0,
                   pages_fetched: 3,
                   records_fetched: 30,
                   records_normalized: 30,
                   records_persisted: 30,
                   records_failed: 0
                 }
               ]
             } = summary = CJRunThroughput.daily_summary([], now)

      assert_safe_summary(summary)
    end

    test "normalizes day windows" do
      now = ~U[2026-07-02 12:00:00Z]

      assert %{days: 14} = CJRunThroughput.daily_summary([days: "bad"], now)
      assert %{days: 1} = CJRunThroughput.daily_summary([days: 0], now)
      assert %{days: 90} = CJRunThroughput.daily_summary([days: 100], now)
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp import_run_fixture(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProducts",
          query: %{"accountId" => "secret"},
          status: "succeeded",
          started_at: ~U[2026-07-02 12:00:00Z],
          finished_at: ~U[2026-07-02 12:05:00Z],
          page_size: 50,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 1,
          records_normalized: 1,
          records_persisted: 1,
          records_failed: 0,
          error_summary: nil
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp assert_safe_summary(summary) do
    sensitive_keys = MapSet.new([:query, :error_summary, :provider_error_payload, :raw_metadata])

    Enum.each(summary.buckets, fn bucket ->
      keys = bucket |> Map.keys() |> MapSet.new()
      assert MapSet.disjoint?(keys, sensitive_keys)
    end)
  end
end
