defmodule ProductCompare.Ingestion.CJRunReadinessTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJRunReadiness
  alias ProductCompareSchemas.Ingestion.ImportRun

  describe "latest_success/1" do
    test "returns the latest successful CJ run for the requested surface" do
      source = source_fixture()

      _older_success =
        import_run_fixture(source, %{
          surface: "shoppingProducts",
          status: "succeeded",
          started_at: ~U[2026-07-02 08:00:00Z],
          finished_at: ~U[2026-07-02 08:05:00Z]
        })

      latest_success =
        import_run_fixture(source, %{
          surface: "shoppingProducts",
          status: "succeeded",
          started_at: ~U[2026-07-02 09:00:00Z],
          finished_at: ~U[2026-07-02 09:05:00Z]
        })

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "failed",
        started_at: ~U[2026-07-02 10:00:00Z],
        finished_at: ~U[2026-07-02 10:05:00Z]
      })

      import_run_fixture(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        started_at: ~U[2026-07-02 12:00:00Z],
        finished_at: ~U[2026-07-02 12:05:00Z]
      })

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "running",
        started_at: ~U[2026-07-02 13:00:00Z],
        finished_at: nil
      })

      latest_success_id = latest_success.id

      assert %ImportRun{id: ^latest_success_id} =
               CJRunReadiness.latest_success("shoppingProducts")
    end

    test "uses started time and id as deterministic tie breakers" do
      source = source_fixture()

      finished_at = ~U[2026-07-02 09:05:00Z]

      _older_started =
        import_run_fixture(source, %{
          surface: "shoppingProducts",
          started_at: ~U[2026-07-02 08:55:00Z],
          finished_at: finished_at
        })

      _older_id =
        import_run_fixture(source, %{
          surface: "shoppingProducts",
          started_at: ~U[2026-07-02 09:00:00Z],
          finished_at: finished_at
        })

      latest_tie_breaker =
        import_run_fixture(source, %{
          surface: "shoppingProducts",
          started_at: ~U[2026-07-02 09:00:00Z],
          finished_at: finished_at
        })

      latest_tie_breaker_id = latest_tie_breaker.id

      assert %ImportRun{id: ^latest_tie_breaker_id} =
               CJRunReadiness.latest_success("shoppingProducts")
    end

    test "returns nil when the requested surface has no successful CJ run" do
      source = source_fixture()

      import_run_fixture(source, %{
        surface: "shoppingProducts",
        status: "failed",
        finished_at: ~U[2026-07-02 08:05:00Z]
      })

      import_run_fixture(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        finished_at: ~U[2026-07-02 10:05:00Z]
      })

      assert is_nil(CJRunReadiness.latest_success("shoppingProducts"))
    end
  end

  describe "fresh?/2" do
    test "treats the max-age boundary as fresh" do
      max_age_hours = 24
      finished_at = DateTime.add(DateTime.utc_now(), -max_age_hours * 60 * 60, :second)

      assert CJRunReadiness.fresh?(%ImportRun{finished_at: finished_at}, max_age_hours)
    end

    test "returns false for a stale run" do
      max_age_hours = 24
      finished_at = DateTime.add(DateTime.utc_now(), -(max_age_hours * 60 * 60 + 1), :second)

      refute CJRunReadiness.fresh?(%ImportRun{finished_at: finished_at}, max_age_hours)
    end

    test "returns false when the run has no finished_at" do
      refute CJRunReadiness.fresh?(%ImportRun{finished_at: nil}, 24)
    end

    test "returns false for nil input" do
      refute CJRunReadiness.fresh?(nil, 24)
    end
  end
end
