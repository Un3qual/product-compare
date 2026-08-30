defmodule Mix.Tasks.ProductCompare.Ingestion.CjRunsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO
  import ExUnit.CaptureLog

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

    test "rejects invalid report limits and max age values" do
      assert_raise Mix.Error, "invalid --limit: expected a positive integer", fn ->
        capture_io(fn -> CjRuns.run(["--report", "history", "--limit", "0"]) end)
      end

      assert_raise Mix.Error, "CJ runs report limit is 50", fn ->
        capture_io(fn -> CjRuns.run(["--report", "history", "--limit", "51"]) end)
      end

      assert_raise Mix.Error, "invalid --max-age-hours: expected a positive integer", fn ->
        capture_io(fn -> CjRuns.run(["--report", "latest", "--max-age-hours", "0"]) end)
      end
    end

    test "rejects invalid report options before starting the repository" do
      script = """
      result =
        try do
          Mix.Task.run("product_compare.ingestion.cj_runs", ["--report", "history", "--limit", "0"])
          "ok"
        rescue
          error -> "error: " <> Exception.message(error)
        end

      IO.puts("result=\#{result}")
      IO.puts("repo_started=\#{is_pid(Process.whereis(ProductCompare.Repo))}")
      IO.puts("application_started=\#{is_pid(Process.whereis(ProductCompare.Supervisor))}")
      """

      {output, exit_status} =
        System.cmd("mix", ["run", "--no-start", "-e", script],
          env: [{"MIX_ENV", "test"}],
          stderr_to_stdout: true
        )

      assert exit_status == 0, output
      assert output =~ "result=error: invalid --limit: expected a positive integer"
      assert output =~ "repo_started=false"
      assert output =~ "application_started=false"
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

    test "resumes import with saved feed, partner, and candidate scoping" do
      source = source_fixture()
      candidate = insert_candidate!(source, %{provider_feed_id: "feed-scope"})

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        cursor_end: 100,
        page_size: 25,
        query: %{
          "keywords" => nil,
          "currency" => "CAD",
          "serviceableAreas" => ["CA"],
          "adIds" => ["ad-1"],
          "partnerIds" => ["partner-1"],
          "providerFeedId" => "feed-scope",
          "merchantFeedCandidateId" => candidate.id,
          "feedName" => "Scoped Feed"
        }
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})
        {:ok, %{fetched: 1, normalized: 1, persisted: 1, failed: 0, next_cursor: 125}}
      end

      capture_io(fn ->
        assert {:ok, %{next_cursor: 125}} =
                 CjRuns.run_resume(surface: "import", runner: runner, pages: 1)
      end)

      assert_receive {:runner_opts, opts}
      assert opts[:keywords] == nil
      assert opts[:currency] == "CAD"
      assert opts[:serviceable_areas] == ["CA"]
      assert opts[:ad_ids] == ["ad-1"]
      assert opts[:partner_ids] == ["partner-1"]
      assert opts[:provider_feed_id] == "feed-scope"
      assert opts[:merchant_feed_candidate_id] == candidate.id
      assert opts[:feed_name] == "Scoped Feed"
    end

    test "resumes legacy import feed filters from provider feed and advertiser ids" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        cursor_end: 100,
        page_size: 25,
        query: %{
          "keywords" => nil,
          "currency" => "USD",
          "serviceableAreas" => ["US"],
          "advertiserIds" => ["legacy-adv"],
          "providerFeedId" => "legacy-feed",
          "feedName" => "Legacy Feed"
        }
      })

      parent = self()

      runner = fn opts ->
        send(parent, {:runner_opts, opts})
        {:ok, %{fetched: 1, normalized: 1, persisted: 1, failed: 0, next_cursor: 125}}
      end

      capture_io(fn ->
        assert {:ok, %{next_cursor: 125}} =
                 CjRuns.run_resume(surface: "import", runner: runner, pages: 1)
      end)

      assert_receive {:runner_opts, opts}
      assert opts[:keywords] == nil
      assert opts[:ad_ids] == ["legacy-feed"]
      assert opts[:partner_ids] == ["legacy-adv"]
      assert opts[:provider_feed_id] == "legacy-feed"
      assert opts[:feed_name] == "Legacy Feed"
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
          assert {:ok, %{next_cursor: 84}} =
                   CjRuns.run_resume(surface: "discovery", runner: runner, pages: 3)
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

    test "logs runner exceptions with sanitized resume context" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProducts",
        status: "succeeded",
        cursor_end: 100,
        page_size: 25,
        query: %{
          "keywords" => ["secret keyword"],
          "providerFeedId" => "secret-feed",
          "partnerIds" => ["secret-partner"]
        }
      })

      runner = fn _opts ->
        raise ArgumentError,
              "provider-body-marker authorization-header-marker credential-token-marker"
      end

      log =
        capture_log(fn ->
          assert_raise Mix.Error, "CJ product import resume failed", fn ->
            capture_io(fn ->
              CjRuns.run_resume(surface: "import", runner: runner, pages: 2)
            end)
          end
        end)

      assert log =~ "CJ import resume runner failed"
      assert log =~ "kind=error"
      assert log =~ "reason=ArgumentError"
      assert log =~ "product_compare_ingestion_cj_runs_test.exs"
      assert log =~ "surface=shoppingProducts"
      assert log =~ "cursor=100"
      assert log =~ "limit=25"
      assert log =~ "pages=2"
      assert log =~ "has_provider_feed_id=true"
      assert log =~ "partner_ids_count=1"
      refute log =~ "secret keyword"
      refute log =~ "secret-feed"
      refute log =~ "secret-partner"
      refute log =~ "provider-body-marker"
      refute log =~ "authorization-header-marker"
      refute log =~ "credential-token-marker"
    end

    test "logs runner throws with sanitized resume context" do
      source = source_fixture()

      insert_run!(source, %{
        surface: "shoppingProductFeeds",
        status: "succeeded",
        cursor_end: 80,
        page_size: 50,
        query: %{"advertiserCountry" => "CA"}
      })

      runner = fn _opts ->
        throw(
          {:resume_failed,
           %{
             body: "provider-body-marker",
             authorization: "authorization-header-marker",
             token: "credential-token-marker"
           }}
        )
      end

      log =
        capture_log(fn ->
          assert_raise Mix.Error, "CJ feed discovery resume failed", fn ->
            capture_io(fn ->
              CjRuns.run_resume(surface: "discovery", runner: runner, pages: 3)
            end)
          end
        end)

      assert log =~ "CJ discovery resume runner failed"
      assert log =~ "kind=throw"
      assert log =~ "reason=resume_failed"
      assert log =~ "product_compare_ingestion_cj_runs_test.exs"
      assert log =~ "surface=shoppingProductFeeds"
      assert log =~ "advertiser_country=CA"
      assert log =~ "cursor=80"
      assert log =~ "limit=50"
      assert log =~ "pages=3"
      refute log =~ "provider-body-marker"
      refute log =~ "authorization-header-marker"
      refute log =~ "credential-token-marker"
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          provider: "cj",
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
