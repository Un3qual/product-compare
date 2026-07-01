defmodule Mix.Tasks.ProductCompare.Ingestion.CjRunsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(MerchantFeedCandidate)
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run/1 reports" do
    test "prints latest import status and redacts provider errors" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        started_at: hours_ago(4),
        finished_at: hours_ago(3),
        records_persisted: 12
      })

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "failed",
        started_at: hours_ago(1),
        finished_at: hours_ago(1),
        records_failed: 2,
        error_summary: "CJ_API_TOKEN=secret accountId=123 tracking=aff_sub"
      })

      output = capture_io(fn -> CjRuns.run(["--surface", "import", "--report", "latest"]) end)

      assert output =~ "surface=shoppingProducts"
      assert output =~ "latest_status=failed"
      assert output =~ "latest_records_failed=2"
      assert output =~ "latest_error_summary=redacted"
      assert output =~ "latest_success_status=succeeded"
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "secret"
      refute output =~ "accountId"
      refute output =~ "aff_sub"
    end

    test "prints discovery history with limit and candidate count" do
      source = source_fixture()

      older = insert_run!(source, %{surface: "shoppingProductFeeds", started_at: seconds_ago(90)})
      newer = insert_run!(source, %{surface: "shoppingProductFeeds", started_at: seconds_ago(30)})
      _import = insert_run!(source, %{surface: "shoppingProducts", started_at: seconds_ago(5)})

      insert_candidate!(source, %{provider_feed_id: "feed-1"})
      insert_candidate!(source, %{provider_feed_id: "feed-2"})

      output =
        capture_io(fn ->
          CjRuns.run(["--surface", "discovery", "--report", "history", "--limit", "1"])
        end)

      assert output =~ "provider=cj surface=shoppingProductFeeds report=history count=1"
      assert output =~ "candidate_count=2"
      assert output =~ "run_id=#{newer.id}"
      refute output =~ "run_id=#{older.id}"
    end

    test "prints failed runs across both surfaces and can require a clean history" do
      source = source_fixture()

      import_failed =
        insert_run!(source, %{
          surface: "shoppingProducts",
          status: "failed",
          started_at: seconds_ago(60)
        })

      discovery_failed =
        insert_run!(source, %{
          surface: "shoppingProductFeeds",
          status: "failed",
          started_at: seconds_ago(30)
        })

      _success = insert_run!(source, %{surface: "shoppingProducts", status: "succeeded"})

      output = capture_io(fn -> CjRuns.run(["--report", "failed"]) end)

      assert output =~ "provider=cj failed_count=2 surface=all"
      assert output =~ "run_id=#{discovery_failed.id}"
      assert output =~ "run_id=#{import_failed.id}"
      refute output =~ "status=succeeded"

      assert_raise Mix.Error, "failed CJ ingestion runs found", fn ->
        capture_io(fn -> CjRuns.run(["--report", "failed", "--require-clean"]) end)
      end
    end
  end

  describe "run_resume/1" do
    test "resumes import from latest successful import cursor" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        cursor_end: 100,
        page_size: 25,
        query: %{"keywords" => ["monitor"], "currency" => "USD", "serviceableAreas" => ["US"]}
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})
        {:ok, %{fetched: 3, normalized: 3, persisted: 2, failed: 0, next_cursor: 125}}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{next_cursor: 125}} =
                   CjRuns.run_resume(surface: "import", runner: runner, pages: 2)
        end)

      assert_receive {:runner_opts, opts}
      assert opts[:cursor] == 100
      assert opts[:keywords] == ["monitor"]
      assert opts[:currency] == "USD"
      assert opts[:serviceable_areas] == ["US"]
      assert opts[:limit] == 25
      assert opts[:pages] == 2
      assert opts[:print_report] == false
      assert output =~ "surface=shoppingProducts cursor_start=100"
      assert output =~ "persisted=2"
      assert output =~ "next_cursor=125"
    end

    test "resumes discovery from latest successful discovery cursor" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        cursor_end: 80,
        page_size: 50,
        query: %{"advertiserCountry" => "CA"}
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})
        {:ok, %{feeds_fetched: 4, candidates_persisted: 4, failed: 0, next_cursor: 84}}
      end

      output =
        capture_io(fn ->
          assert :ok = CjRuns.run_resume(surface: "discovery", runner: runner, pages: 3)
        end)

      assert_receive {:runner_opts, opts}
      assert opts[:cursor] == 80
      assert opts[:advertiser_country] == "CA"
      assert opts[:limit] == 50
      assert opts[:pages] == 3
      assert output =~ "surface=shoppingProductFeeds cursor_start=80"
      assert output =~ "candidates_persisted=4"
      assert output =~ "next_cursor=84"
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{kind: "affiliate_feed", name: "CJ #{suffix}", domain: "cj-#{suffix}.example"},
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
          query: %{},
          status: "succeeded",
          started_at: DateTime.utc_now(),
          finished_at: DateTime.utc_now(),
          cursor_start: 0,
          cursor_end: 0,
          page_size: 25,
          pages_requested: 1,
          pages_fetched: 1,
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

  defp seconds_ago(seconds) do
    DateTime.utc_now()
    |> DateTime.add(-seconds, :second)
    |> DateTime.truncate(:microsecond)
  end
end
