defmodule ProductCompare.Ingestion.CJRunHealthTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion.CJRunHealth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  describe "summary/0" do
    test "returns latest safe CJ run health per surface" do
      source = source_fixture()

      import_run_fixture(source, %{
        provider: "cj",
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-07-02 10:00:00Z],
        finished_at: ~U[2026-07-02 10:05:00Z],
        cursor_start: 0,
        cursor_end: 99,
        page_size: 50,
        pages_requested: 2,
        pages_fetched: 2,
        records_fetched: 100,
        records_normalized: 98,
        records_persisted: 95,
        records_failed: 3,
        query: %{"token" => "secret"}
      })

      latest_products =
        import_run_fixture(source, %{
          provider: "cj",
          surface: "shoppingProducts",
          status: "succeeded",
          started_at: ~U[2026-07-02 12:00:00Z],
          finished_at: ~U[2026-07-02 12:03:00Z],
          cursor_start: 100,
          cursor_end: 149,
          page_size: 50,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 50,
          records_normalized: 49,
          records_persisted: 49,
          records_failed: 0,
          query: %{"providerFeedId" => "secret-feed"}
        })

      latest_feeds =
        import_run_fixture(source, %{
          provider: "cj",
          surface: "shoppingProductFeeds",
          status: "failed",
          started_at: ~U[2026-07-02 11:00:00Z],
          finished_at: ~U[2026-07-02 11:01:00Z],
          cursor_start: 0,
          cursor_end: 49,
          page_size: 50,
          pages_requested: 1,
          pages_fetched: 0,
          records_fetched: 0,
          records_normalized: 0,
          records_persisted: 0,
          records_failed: 1,
          error_summary: "provider body with account id",
          query: %{"accountId" => "secret-account"}
        })

      import_run_fixture(source, %{
        provider: "awin",
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: ~U[2026-07-02 13:00:00Z]
      })

      latest_products_started_at = latest_products.started_at
      latest_products_finished_at = latest_products.finished_at
      latest_feeds_started_at = latest_feeds.started_at
      latest_feeds_finished_at = latest_feeds.finished_at

      assert %{
               provider: "cj",
               surfaces: %{
                 shoppingProducts: %{
                   surface: "shoppingProducts",
                   missing: false,
                   status: "succeeded",
                   successful: true,
                   started_at: ^latest_products_started_at,
                   finished_at: ^latest_products_finished_at,
                   cursor_start: 100,
                   cursor_end: 149,
                   page_size: 50,
                   pages_requested: 1,
                   pages_fetched: 1,
                   records_fetched: 50,
                   records_normalized: 49,
                   records_persisted: 49,
                   records_failed: 0,
                   has_error_summary: false
                 },
                 shoppingProductFeeds: %{
                   surface: "shoppingProductFeeds",
                   missing: false,
                   status: "failed",
                   successful: false,
                   started_at: ^latest_feeds_started_at,
                   finished_at: ^latest_feeds_finished_at,
                   cursor_start: 0,
                   cursor_end: 49,
                   page_size: 50,
                   pages_requested: 1,
                   pages_fetched: 0,
                   records_fetched: 0,
                   records_normalized: 0,
                   records_persisted: 0,
                   records_failed: 1,
                   has_error_summary: true
                 }
               }
             } = summary = CJRunHealth.summary()

      assert_safe_summary(summary)
    end

    test "returns missing entries when a CJ surface has no recorded run" do
      missing_products = %{
        surface: "shoppingProducts",
        missing: true,
        status: nil,
        successful: nil,
        started_at: nil,
        finished_at: nil,
        cursor_start: nil,
        cursor_end: nil,
        page_size: nil,
        pages_requested: nil,
        pages_fetched: nil,
        records_fetched: nil,
        records_normalized: nil,
        records_persisted: nil,
        records_failed: nil,
        has_error_summary: nil
      }

      missing_feeds = %{missing_products | surface: "shoppingProductFeeds"}

      assert %{
               provider: "cj",
               surfaces: %{
                 shoppingProducts: ^missing_products,
                 shoppingProductFeeds: ^missing_feeds
               }
             } = summary = CJRunHealth.summary()

      assert_safe_summary(summary)
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
          query: %{},
          status: "succeeded",
          started_at: ~U[2026-07-02 12:00:00Z],
          finished_at: ~U[2026-07-02 12:05:00Z],
          cursor_start: nil,
          cursor_end: nil,
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

    Enum.each(summary.surfaces, fn {_surface, health} ->
      keys = health |> Map.keys() |> MapSet.new()
      assert MapSet.disjoint?(keys, sensitive_keys)
    end)
  end
end
