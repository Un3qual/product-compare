defmodule Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryStatusTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryStatus
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "run/1" do
    test "raises when success is required and no shopping product feed run succeeded" do
      assert_raise Mix.Error, "no successful CJ feed discovery run found", fn ->
        capture_io(fn -> CjDiscoveryStatus.run(["--require-success"]) end)
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
        records_persisted: 10,
        records_failed: 0
      })

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        pages_fetched: 1,
        records_fetched: 5,
        records_persisted: 4,
        records_failed: 1,
        error_summary: "provider\ntimeout"
      })

      output = capture_io(fn -> CjDiscoveryStatus.run([]) end)

      assert output =~ "latest_status=failed"
      assert output =~ "latest_pages_fetched=1"
      assert output =~ "latest_records_failed=1"
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

      assert_raise Mix.Error, "latest successful CJ feed discovery run is stale", fn ->
        capture_io(fn ->
          CjDiscoveryStatus.run(["--max-age-hours", "24", "--require-success"])
        end)
      end
    end

    test "prints fresh successful run counts and candidate count" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(2),
        finished_at: hours_ago(1),
        pages_fetched: 3,
        records_fetched: 30,
        records_persisted: 29,
        records_failed: 1
      })

      insert_candidate!(source, %{provider_feed_id: "feed-1"})
      insert_candidate!(source, %{provider_feed_id: "feed-2"})

      output = capture_io(fn -> CjDiscoveryStatus.run(["--require-success"]) end)

      assert output =~ "latest_status=succeeded"
      assert output =~ "latest_pages_fetched=3"
      assert output =~ "latest_records_fetched=30"
      assert output =~ "latest_records_persisted=29"
      assert output =~ "latest_records_failed=1"
      assert output =~ "latest_error_summary=\n"
      assert output =~ "latest_success_status=succeeded"
      assert output =~ "fresh=true"
      assert output =~ "candidate_count=2"
    end

    test "falls back to default max age for invalid and non-positive values" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(47),
        finished_at: hours_ago(47)
      })

      invalid_output =
        capture_io(fn ->
          CjDiscoveryStatus.run(["--max-age-hours", "invalid", "--require-success"])
        end)

      non_positive_output =
        capture_io(fn ->
          CjDiscoveryStatus.run(["--max-age-hours", "0", "--require-success"])
        end)

      assert invalid_output =~ "fresh=true"
      assert non_positive_output =~ "fresh=true"
    end

    test "does not print raw metadata from candidates" do
      source = source_fixture()

      insert_run!(source, %{
        status: "succeeded",
        started_at: hours_ago(2),
        finished_at: hours_ago(1)
      })

      insert_candidate!(source, %{
        provider_feed_id: "feed-secret",
        raw_metadata: %{"secret_marker" => "do-not-print"}
      })

      output = capture_io(fn -> CjDiscoveryStatus.run([]) end)

      assert output =~ "candidate_count=1"
      refute output =~ "raw_metadata"
      refute output =~ "secret_marker"
      refute output =~ "do-not-print"
    end

    test "does not print raw provider error summaries" do
      source = source_fixture()

      insert_run!(source, %{
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        error_summary:
          "HTTP 500 GraphQL body={\"accountId\":\"123456\",\"tracking\":\"aff_sub\"," <>
            "\"errors\":[{\"message\":\"CJ_API_TOKEN=secret\"}]}"
      })

      output = capture_io(fn -> CjDiscoveryStatus.run([]) end)

      assert output =~ "latest_error_summary="
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "secret"
      refute output =~ "accountId"
      refute output =~ "123456"
      refute output =~ "tracking"
      refute output =~ "aff_sub"
      refute output =~ "GraphQL body"
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
          surface: "shoppingProductFeeds",
          query: %{"advertiserCountry" => "US"},
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

  defp insert_candidate!(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          last_seen_at: DateTime.utc_now(),
          product_count: 10,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: hours_ago(3),
          raw_metadata: %{},
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert!()
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours, :hour)
    |> DateTime.truncate(:microsecond)
  end
end
