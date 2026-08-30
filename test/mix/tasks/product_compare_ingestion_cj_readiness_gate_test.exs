defmodule Mix.Tasks.ProductCompare.Ingestion.CjReadinessGateTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjReadinessGate
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  @cj_env_vars ~w(CJ_API_TOKEN CJ_ACCOUNT_ID)
  @scheduler_config_keys ~w(cj_feed_discovery_scheduler cj_product_import_scheduler)a

  setup do
    Repo.delete_all(MerchantFeedCandidate)
    Repo.delete_all(ImportRun)

    original_env =
      @cj_env_vars
      |> Map.new(fn var -> {var, System.get_env(var)} end)

    original_scheduler_configs =
      Map.new(@scheduler_config_keys, fn key ->
        {key, Application.get_env(:product_compare, key)}
      end)

    Enum.each(@cj_env_vars, &System.delete_env/1)
    Enum.each(@scheduler_config_keys, &set_scheduler_enabled(&1, false))

    on_exit(fn ->
      Enum.each(original_env, fn
        {var, nil} -> System.delete_env(var)
        {var, value} -> System.put_env(var, value)
      end)

      Enum.each(original_scheduler_configs, fn {key, value} ->
        restore_app_env(key, value)
      end)
    end)
  end

  describe "run/1" do
    test "reports missing required credentials without printing values" do
      output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert output =~
               "provider=cj ready=false credentials_ready=false missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID"

      assert output =~ "discovery_fresh=false"
      assert output =~ "import_fresh=false"
      assert output =~ "candidate_count=0"
      assert output =~ "min_candidates=1"
      assert output =~ "pursued_program_count=0"
      assert output =~ "min_pursued_programs=0"
    end

    test "treats whitespace credentials as missing" do
      System.put_env("CJ_API_TOKEN", "  ")
      System.put_env("CJ_ACCOUNT_ID", "\t")

      output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert output =~ "credentials_ready=false"
      assert output =~ "missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID"
    end

    test "reports present credentials by readiness only" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert output =~ "credentials_ready=true"
      assert output =~ "missing_required= "
      refute output =~ "secret-token"
      refute output =~ "1234567"
    end

    test "reports ready when credentials, fresh runs, and feed counts pass" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      source = source_fixture()

      insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(2)})
      insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})
      insert_feed!(source, %{provider_feed_id: "feed-one"})
      insert_feed!(source, %{provider_feed_id: "feed-two"})

      output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert output ==
               "provider=cj ready=true credentials_ready=true missing_required= discovery_fresh=true import_fresh=true candidate_count=2 min_candidates=1 pursued_program_count=0 min_pursued_programs=0 require_scheduled=false feed_discovery_schedule_enabled=false product_import_schedule_enabled=false schedules_ready=false\n"

      refute output =~ "secret-token"
      refute output =~ "1234567"
      refute output =~ "provider-payload"
      refute output =~ "aff_sub"
    end

    test "preserves manual readiness when schedules are not required" do
      seed_ready_cj_state!()

      output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert output =~ "ready=true"
      assert output =~ "require_scheduled=false"
      assert output =~ "feed_discovery_schedule_enabled=false"
      assert output =~ "product_import_schedule_enabled=false"
      assert output =~ "schedules_ready=false"
    end

    test "requires both schedules when scheduled operation is requested" do
      seed_ready_cj_state!()
      set_scheduler_enabled(:cj_feed_discovery_scheduler, true)

      output = capture_io(fn -> CjReadinessGate.run(["--require-scheduled"]) end)

      assert output =~ "ready=false"
      assert output =~ "require_scheduled=true"
      assert output =~ "feed_discovery_schedule_enabled=true"
      assert output =~ "product_import_schedule_enabled=false"
      assert output =~ "schedules_ready=false"
    end

    test "reports the effective scheduler configuration" do
      seed_ready_cj_state!()
      set_scheduler_enabled(:cj_feed_discovery_scheduler, true)
      set_scheduler_enabled(:cj_product_import_scheduler, true)

      output = capture_io(fn -> CjReadinessGate.run(["--require-scheduled"]) end)

      assert output =~ "ready=true"
      assert output =~ "feed_discovery_schedule_enabled=true"
      assert output =~ "product_import_schedule_enabled=true"
      assert output =~ "schedules_ready=true"
    end

    test "enforces scheduled readiness through the existing require-ready switch" do
      seed_ready_cj_state!()

      output =
        capture_io(fn ->
          assert_raise Mix.Error, "CJ ingestion is not ready", fn ->
            CjReadinessGate.run(["--require-scheduled", "--require-ready"])
          end
        end)

      assert output =~ "ready=false"
      assert output =~ "require_scheduled=true"
      assert output =~ "schedules_ready=false"
    end

    test "fails readiness when discovery freshness is stale" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      source = source_fixture()

      insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(49)})
      insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})
      insert_feed!(source)

      stale_discovery_output = capture_io(fn -> CjReadinessGate.run([]) end)

      assert stale_discovery_output =~ "ready=false"
      assert stale_discovery_output =~ "discovery_fresh=false"
      assert stale_discovery_output =~ "import_fresh=true"
    end

    test "fails readiness when import freshness is stale" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      source = source_fixture()

      insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(1)})
      insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(49)})
      insert_feed!(source)

      stale_import_output =
        capture_io(fn ->
          CjReadinessGate.run(["--max-discovery-age-hours", "48", "--max-import-age-hours", "24"])
        end)

      assert stale_import_output =~ "ready=false"
      assert stale_import_output =~ "discovery_fresh=true"
      assert stale_import_output =~ "import_fresh=false"
    end

    test "readiness counts programs rather than feeds" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      source = source_fixture()

      insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(1)})
      insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})

      first_feed =
        insert_feed!(source, %{
          advertiser_id: "adv-shared-program",
          provider_feed_id: "feed-shared-one"
        })

      insert_feed!(source, %{
        advertiser_id: "adv-shared-program",
        provider_feed_id: "feed-shared-two"
      })

      place_in_stage!(first_feed, "selected")

      output =
        capture_io(fn ->
          CjReadinessGate.run(["--min-pursued-programs", "2"])
        end)

      assert output =~ "ready=false"
      assert output =~ "candidate_count=2"
      assert output =~ "pursued_program_count=1"
      assert output =~ "min_pursued_programs=2"
      refute output =~ "shortlisted"
      refute output =~ "review_status"
    end

    test "advancing selected to applied or accepted preserves pursued count" do
      System.put_env("CJ_API_TOKEN", "secret-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")
      source = source_fixture()

      insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(1)})
      insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})

      feed =
        source
        |> insert_feed!(%{advertiser_id: "adv-pursued", provider_feed_id: "feed-pursued"})
        |> place_in_stage!("selected")

      Enum.each(["selected", "applied", "accepted"], fn stage ->
        place_in_stage!(feed, stage)

        output =
          capture_io(fn ->
            CjReadinessGate.run(["--min-pursued-programs", "1"])
          end)

        assert output =~ "ready=true"
        assert output =~ "pursued_program_count=1"
        assert output =~ "min_pursued_programs=1"
      end)
    end

    test "raises after printing the report when readiness is required" do
      output =
        capture_io(fn ->
          assert_raise Mix.Error, "CJ ingestion is not ready", fn ->
            CjReadinessGate.run(["--require-ready"])
          end
        end)

      assert output =~ "provider=cj ready=false"
    end

    test "rejects malformed CLI input" do
      assert_raise Mix.Error, "unsupported option: --bogus", fn ->
        capture_io(fn -> CjReadinessGate.run(["--bogus"]) end)
      end

      assert_raise Mix.Error, "unexpected argument: extra", fn ->
        capture_io(fn -> CjReadinessGate.run(["extra"]) end)
      end

      assert_raise Mix.Error, "invalid value for --max-import-age-hours: many", fn ->
        capture_io(fn -> CjReadinessGate.run(["--max-import-age-hours", "many"]) end)
      end

      assert_raise Mix.Error,
                   "invalid --min-pursued-programs: expected a non-negative integer",
                   fn ->
                     capture_io(fn -> CjReadinessGate.run(["--min-pursued-programs", "-1"]) end)
                   end
    end

    test "rejects malformed input before starting the repository" do
      script = """
      result =
        try do
          Mix.Task.run("product_compare.ingestion.cj_readiness_gate", ["--bogus"])
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
      assert output =~ "result=error: unsupported option: --bogus"
      assert output =~ "repo_started=false"
      assert output =~ "application_started=false"
    end

    test "does not start ProductCompare.Supervisor or CJ schedulers" do
      script = """
      Mix.Task.run("product_compare.ingestion.cj_readiness_gate", [])
      IO.puts("product_compare_supervisor=\#{inspect(Process.whereis(ProductCompare.Supervisor))}")
      IO.puts("feed_discovery_scheduler=\#{inspect(Process.whereis(ProductCompare.Ingestion.CJFeedDiscoveryScheduler))}")
      IO.puts("product_import_scheduler=\#{inspect(Process.whereis(ProductCompare.Ingestion.CJProductImportScheduler))}")
      """

      {output, exit_status} =
        System.cmd("mix", ["run", "--no-start", "-e", script],
          env: [{"MIX_ENV", "test"}],
          stderr_to_stdout: true
        )

      assert exit_status == 0, output
      assert output =~ "provider=cj"
      assert output =~ "product_compare_supervisor=nil"
      assert output =~ "feed_discovery_scheduler=nil"
      assert output =~ "product_import_scheduler=nil"
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

  defp seed_ready_cj_state! do
    System.put_env("CJ_API_TOKEN", "secret-token")
    System.put_env("CJ_ACCOUNT_ID", "1234567")
    source = source_fixture()

    insert_run!(source, %{surface: "shoppingProductFeeds", finished_at: hours_ago(1)})
    insert_run!(source, %{surface: "shoppingProducts", finished_at: hours_ago(1)})
    insert_feed!(source)

    source
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
          pages_fetched: 1,
          records_fetched: 10,
          records_normalized: 10,
          records_persisted: 10,
          records_failed: 0
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp insert_feed!(source, attrs \\ %{}) do
    attrs =
      Map.merge(
        %{
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
          raw_metadata: %{
            "account_id_marker" => "1234567",
            "provider_payload_marker" => "provider-payload",
            "token_marker" => "secret-token",
            "tracking_marker" => "aff_sub"
          },
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    {:ok, feed} = Ingestion.upsert_merchant_feed_candidate(source, attrs)
    feed
  end

  defp place_in_stage!(feed, stage) do
    program = Repo.get!(CJProgram, feed.cj_program_id)

    assert {:ok, _program} =
             CJPrograms.update_lifecycle(program.entropy_id, %{stage: stage}, DateTime.utc_now())

    feed
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours * 60 * 60, :second)
    |> DateTime.truncate(:microsecond)
  end

  defp restore_app_env(key, nil), do: Application.delete_env(:product_compare, key)
  defp restore_app_env(key, value), do: Application.put_env(:product_compare, key, value)

  defp set_scheduler_enabled(key, enabled) do
    config = Application.get_env(:product_compare, key, [])
    Application.put_env(:product_compare, key, Keyword.put(config, :enabled, enabled))
  end
end
