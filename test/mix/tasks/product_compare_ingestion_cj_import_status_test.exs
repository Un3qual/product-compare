defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportStatusTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImportStatus
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  describe "run/1" do
    test "raises when success is required and no shopping product import succeeded" do
      source = source_fixture()

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        error_summary: "provider unavailable"
      })

      assert_raise Mix.Error, "no successful CJ product import found", fn ->
        capture_io(fn -> CjImportStatus.run(["--require-success"]) end)
      end
    end

    test "prints failed latest run and older successful run" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(4),
        finished_at: hours_ago(3),
        pages_fetched: 2,
        records_fetched: 10,
        records_normalized: 9,
        records_persisted: 8,
        records_failed: 1
      })

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        pages_fetched: 1,
        records_fetched: 5,
        records_normalized: 4,
        records_persisted: 3,
        records_failed: 2,
        error_summary: "provider\ntimeout"
      })

      output = capture_io(fn -> CjImportStatus.run([]) end)

      assert output =~ "latest_status=failed"
      assert output =~ "latest_pages_fetched=1"
      assert output =~ "latest_records_fetched=5"
      assert output =~ "latest_records_normalized=4"
      assert output =~ "latest_records_persisted=3"
      assert output =~ "latest_records_failed=2"
      assert output =~ "latest_error_summary=redacted"
      refute output =~ "provider timeout"
      refute output =~ "provider\ntimeout"
      assert output =~ "latest_success_status=succeeded"
    end

    test "raises when the latest successful run is stale" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(26),
        finished_at: hours_ago(25)
      })

      assert_raise Mix.Error, "latest successful CJ product import is stale", fn ->
        capture_io(fn ->
          CjImportStatus.run(["--max-age-hours", "24", "--require-success"])
        end)
      end
    end

    test "prints fresh successful run counts" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(2),
        finished_at: hours_ago(1),
        pages_fetched: 3,
        records_fetched: 30,
        records_normalized: 28,
        records_persisted: 27,
        records_failed: 1
      })

      output = capture_io(fn -> CjImportStatus.run(["--require-success"]) end)

      assert output =~ "latest_status=succeeded"
      assert output =~ "latest_pages_fetched=3"
      assert output =~ "latest_records_fetched=30"
      assert output =~ "latest_records_normalized=28"
      assert output =~ "latest_records_persisted=27"
      assert output =~ "latest_records_failed=1"
      assert output =~ "latest_error_summary=\n"
      assert output =~ "latest_success_status=succeeded"
      assert output =~ "fresh=true"
    end

    test "ignores shopping product feed discovery runs" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        pages_fetched: 99,
        records_fetched: 999
      })

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(2),
        finished_at: hours_ago(2),
        pages_fetched: 1,
        records_fetched: 2,
        records_failed: 2
      })

      output = capture_io(fn -> CjImportStatus.run([]) end)

      assert output =~ "latest_status=failed"
      assert output =~ "latest_pages_fetched=1"
      assert output =~ "latest_records_fetched=2"
      assert output =~ "latest_success_status="
      refute output =~ "latest_status=succeeded"
      refute output =~ "latest_pages_fetched=99"
      refute output =~ "latest_records_fetched=999"
    end

    test "does not print raw provider error summaries" do
      source = source_fixture()

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        error_summary:
          "HTTP 500 GraphQL response body={\"accountId\":\"123456\"," <>
            "\"tracking\":\"sid=aff_sub&utm_campaign=secret\"," <>
            "\"errors\":[{\"message\":\"CJ_API_TOKEN=secret\"}]}"
      })

      output = capture_io(fn -> CjImportStatus.run([]) end)

      assert output =~ "latest_error_summary=redacted"
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "secret"
      refute output =~ "accountId"
      refute output =~ "123456"
      refute output =~ "GraphQL response body"
      refute output =~ "tracking"
      refute output =~ "sid="
      refute output =~ "aff_sub"
      refute output =~ "utm_campaign"
      refute output =~ "\"errors\""
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
          domain: "cj.example"
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
          surface: "shoppingProducts",
          query: %{"keywords" => ["trail shoe"]},
          status: "succeeded",
          started_at: hours_ago(2),
          finished_at: hours_ago(1),
          pages_fetched: 0,
          records_fetched: 0,
          records_normalized: 0,
          records_persisted: 0,
          records_failed: 0
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
