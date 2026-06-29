defmodule Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryHistoryTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryHistory
  alias ProductCompare.Ingestion.CJFeedDiscoveryScheduler
  alias ProductCompare.Ingestion.CJProductImportScheduler
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run/1" do
    test "prints only shoppingProductFeeds runs in newest-first order" do
      source = source_fixture()

      new_run =
        insert_run!(source, %{
          status: "succeeded",
          started_at: hours_ago(1),
          finished_at: hours_ago(1),
          cursor_start: 0,
          cursor_end: 10,
          pages_requested: 2,
          pages_fetched: 2,
          records_fetched: 20,
          records_persisted: 18,
          records_failed: 2,
          error_summary: ""
        })

      old_run =
        insert_run!(source, %{
          status: "failed",
          started_at: hours_ago(5),
          finished_at: hours_ago(4),
          cursor_start: 10,
          cursor_end: 24,
          pages_requested: 3,
          pages_fetched: 4,
          records_fetched: 40,
          records_persisted: 32,
          records_failed: 4,
          error_summary: "failed in provider"
        })

      insert_run!(source, %{surface: "shoppingProducts"})
      insert_run!(source, %{provider: "not-cj"})

      output = capture_io(fn -> CjDiscoveryHistory.run([]) end)

      lines =
        output
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      assert length(lines) == 2
      assert Enum.at(lines, 0) =~ "run_id=#{new_run.id}"
      assert Enum.at(lines, 0) =~ "status=#{new_run.status}"
      assert Enum.at(lines, 0) =~ "started_at=#{DateTime.to_iso8601(new_run.started_at)}"
      assert Enum.at(lines, 0) =~ "finished_at=#{DateTime.to_iso8601(new_run.finished_at)}"
      assert Enum.at(lines, 0) =~ "cursor_start=#{new_run.cursor_start}"
      assert Enum.at(lines, 0) =~ "cursor_end=#{new_run.cursor_end}"
      assert Enum.at(lines, 0) =~ "pages_requested=#{new_run.pages_requested}"
      assert Enum.at(lines, 0) =~ "pages_fetched=#{new_run.pages_fetched}"
      assert Enum.at(lines, 0) =~ "records_fetched=#{new_run.records_fetched}"
      assert Enum.at(lines, 0) =~ "records_persisted=#{new_run.records_persisted}"
      assert Enum.at(lines, 0) =~ "records_failed=#{new_run.records_failed}"
      assert Enum.at(lines, 0) =~ "error_summary="

      assert Enum.at(lines, 1) =~ "run_id=#{old_run.id}"
      assert Enum.at(lines, 1) =~ "error_summary="
      assert Enum.at(lines, 1) =~ "status=#{old_run.status}"
      refute output =~ "shoppingProducts"
      refute output =~ "not-cj"
    end

    test "limits to requested count" do
      source = source_fixture()

      Enum.each(0..2, fn index ->
        insert_run!(source, %{
          status: "succeeded",
          started_at: hours_ago(index + 1),
          cursor_start: index
        })
      end)

      lines =
        capture_io(fn -> CjDiscoveryHistory.run(["--limit", "1"]) end)
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      assert length(lines) == 1
    end

    test "normalizes out-of-range limits" do
      source = source_fixture()

      Enum.each(0..59, fn index ->
        insert_run!(source, %{
          status: "succeeded",
          started_at: hours_ago(index),
          cursor_start: index * 10,
          cursor_end: index * 10 + 9,
          pages_requested: index + 1,
          pages_fetched: index + 1,
          records_fetched: index * 10 + 5,
          records_persisted: index * 10,
          records_failed: 0
        })
      end)

      output_default =
        capture_io(fn -> CjDiscoveryHistory.run(["--limit", "0"]) end)
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      output_clamped =
        capture_io(fn -> CjDiscoveryHistory.run(["--limit", "99"]) end)
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      output_bad_value =
        capture_io(fn -> CjDiscoveryHistory.run(["--limit", "invalid"]) end)
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      assert length(output_default) == 1
      assert length(output_clamped) == 50
      assert length(output_bad_value) == 10
    end

    test "redacts non-empty error summaries" do
      source = source_fixture()

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        error_summary: "provider=secret-key tracking=aff_sub"
      })

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(2),
        error_summary: nil
      })

      output = capture_io(fn -> CjDiscoveryHistory.run([]) end)

      lines =
        output
        |> String.trim()
        |> String.split("\n")
        |> Enum.filter(&String.starts_with?(&1, "run_id="))

      assert Enum.at(lines, 0) =~ "error_summary=redacted"
      assert Enum.at(lines, 1) =~ "error_summary="
      refute output =~ "provider=secret-key"
      refute output =~ "tracking=aff_sub"
    end

    test "does not start ProductCompare supervision tree or schedulers" do
      source = source_fixture()
      insert_run!(source, %{status: "succeeded"})

      before_supervisor = Process.whereis(ProductCompare.Supervisor)
      before_discovery_scheduler = Process.whereis(CJFeedDiscoveryScheduler)
      before_import_scheduler = Process.whereis(CJProductImportScheduler)

      capture_io(fn -> CjDiscoveryHistory.run([]) end)

      assert Process.whereis(ProductCompare.Supervisor) == before_supervisor
      assert Process.whereis(CJFeedDiscoveryScheduler) == before_discovery_scheduler
      assert Process.whereis(CJProductImportScheduler) == before_import_scheduler
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

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

  defp insert_run!(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProductFeeds",
          query: %{"advertiserCountry" => "US"},
          status: "succeeded",
          started_at: hours_ago(2),
          finished_at: hours_ago(1),
          cursor_start: nil,
          cursor_end: nil,
          pages_requested: 1,
          pages_fetched: 0,
          records_fetched: 0,
          records_normalized: 0,
          records_persisted: 0,
          records_failed: 0,
          error_summary: nil
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours, :hour)
    |> DateTime.truncate(:microsecond)
  end
end
