defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportHistoryTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImportHistory
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Ingestion.CJFeedDiscoveryScheduler
  alias ProductCompare.Ingestion.CJProductImportScheduler
  alias ProductCompare.Repo
  alias ProductCompare.TestSupport.CJIngestionCleanup
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  setup do
    Repo.delete_all(ImportRun)
    :ok
  end

  describe "run/1" do
    test "prints only shoppingProducts CJ runs newest first" do
      source = source_fixture()

      oldest_run = insert_run!(source, %{started_at: seconds_ago(120)})
      newest_run = insert_run!(source, %{started_at: seconds_ago(60)})
      feed_run = insert_run!(source, %{surface: "shoppingProductFeeds", status: "succeeded"})
      other_provider_run = insert_run!(source, %{provider: "amazon", surface: "shoppingProducts"})

      output = capture_io(fn -> CjImportHistory.run([]) end)
      lines = output_lines(output)

      assert length(lines) == 2
      assert String.contains?(hd(lines), "run_id=#{newest_run.id}")
      assert String.contains?(Enum.at(lines, 1), "run_id=#{oldest_run.id}")
      assert lines |> Enum.join("\n") |> String.contains?(~s(status=#{newest_run.status}))

      refute output =~ ~r"run_id=#{feed_run.id}"
      refute output =~ ~r"run_id=#{other_provider_run.id}"
    end

    test "prints one row when limit is 1" do
      source = source_fixture()

      _older_run = insert_run!(source, %{started_at: seconds_ago(120)})
      newer_run = insert_run!(source, %{started_at: seconds_ago(60)})

      output = capture_io(fn -> CjImportHistory.run(["--limit", "1"]) end)
      lines = output_lines(output)

      assert length(lines) == 1
      assert output =~ "run_id=#{newer_run.id}"
    end

    test "normalizes limit bounds and defaults" do
      source = source_fixture()

      Enum.each(1..60, fn index ->
        insert_run!(source, %{started_at: seconds_ago(index)})
      end)

      output_too_low = capture_io(fn -> CjImportHistory.run(["--limit", "0"]) end)
      output_too_high = capture_io(fn -> CjImportHistory.run(["--limit", "99"]) end)

      assert length(output_lines(output_too_low)) == 1
      assert length(output_lines(output_too_high)) == 50
    end

    test "rejects malformed CLI input" do
      assert_raise Mix.Error, "unsupported option: --bogus", fn ->
        capture_io(fn -> CjImportHistory.run(["--bogus"]) end)
      end

      assert_raise Mix.Error, "unexpected argument: extra", fn ->
        capture_io(fn -> CjImportHistory.run(["extra"]) end)
      end

      assert_raise Mix.Error, "invalid value for --limit: not-a-number", fn ->
        capture_io(fn -> CjImportHistory.run(["--limit", "not-a-number"]) end)
      end
    end

    test "redacts stored error summary instead of printing raw body" do
      source = source_fixture()

      raw_error =
        "HTTP 500 GraphQL response body={\"accountId\":\"123456\"," <>
          "\"tracking\":\"aff_sub&utm_campaign=secret\"," <>
          "\"errors\":[{\"message\":\"CJ_API_TOKEN=secret\"}]}"

      insert_run!(source, %{
        status: "failed",
        started_at: seconds_ago(30),
        error_summary: raw_error
      })

      output = capture_io(fn -> CjImportHistory.run(["--limit", "1"]) end)

      assert output =~ "error_summary=redacted"
      refute output =~ "123456"
      refute output =~ "aff_sub"
      refute output =~ "secret"
      refute output =~ "CJ_API_TOKEN"
      refute output =~ "GraphQL response body"
      refute output =~ "\"errors\""
    end

    test "does not start ProductCompare.Supervisor or CJ schedulers" do
      original_discovery_config =
        Application.get_env(:product_compare, :cj_feed_discovery_scheduler)

      original_import_config = Application.get_env(:product_compare, :cj_product_import_scheduler)

      on_exit(fn ->
        restore_env(:cj_feed_discovery_scheduler, original_discovery_config)
        restore_env(:cj_product_import_scheduler, original_import_config)
        CJIngestionCleanup.cleanup!()
        stop_repo_if_started()
        {:ok, _started} = Application.ensure_all_started(:product_compare)
        Ecto.Adapters.SQL.Sandbox.mode(Repo, :manual)
      end)

      :ok = Application.stop(:product_compare)
      RepoOnlyStartup.start!()

      Application.put_env(:product_compare, :cj_feed_discovery_scheduler,
        enabled: true,
        initial_delay_ms: 60_000,
        interval_minutes: 1440
      )

      Application.put_env(:product_compare, :cj_product_import_scheduler,
        enabled: true,
        initial_delay_ms: 60_000,
        interval_minutes: 1440
      )

      source = source_fixture()
      _run = insert_run!(source)

      Mix.Task.reenable("app.config")
      Mix.Task.reenable("app.start")

      output = capture_io(fn -> CjImportHistory.run(["--limit", "1"]) end)

      assert output =~ "run_id="
      refute Process.whereis(ProductCompare.Supervisor)
      refute Process.whereis(CJFeedDiscoveryScheduler)
      refute Process.whereis(CJProductImportScheduler)
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

  defp insert_run!(source, attrs \\ %{}) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProducts",
          query: %{"keywords" => ["trail shoe"]},
          status: "succeeded",
          started_at: DateTime.utc_now(),
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 10,
          records_normalized: 10,
          records_persisted: 9,
          records_failed: 1
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end

  defp seconds_ago(seconds), do: DateTime.add(DateTime.utc_now(), -seconds, :second)

  defp output_lines(output) do
    output |> String.trim() |> String.split("\n", trim: true)
  end

  defp restore_env(key, nil), do: Application.delete_env(:product_compare, key)
  defp restore_env(key, value), do: Application.put_env(:product_compare, key, value)

  defp stop_repo_if_started do
    case Process.whereis(Repo) do
      nil -> :ok
      pid -> GenServer.stop(pid)
    end
  catch
    :exit, _reason -> :ok
  end
end
