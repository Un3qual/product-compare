defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportStatusStartupTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImportStatus
  alias ProductCompare.Ingestion.CJFeedDiscoveryScheduler
  alias ProductCompare.Ingestion.CJProductImportScheduler
  alias ProductCompare.Repo

  test "read-only status checks do not start CJ scheduler children" do
    original_discovery_config =
      Application.get_env(:product_compare, :cj_feed_discovery_scheduler)

    original_import_config = Application.get_env(:product_compare, :cj_product_import_scheduler)

    on_exit(fn ->
      restore_env(:cj_feed_discovery_scheduler, original_discovery_config)
      restore_env(:cj_product_import_scheduler, original_import_config)
      stop_repo_if_started()
      {:ok, _started} = Application.ensure_all_started(:product_compare)
    end)

    :ok = Application.stop(:product_compare)

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

    Mix.Task.reenable("app.config")
    Mix.Task.reenable("app.start")

    output = capture_io(fn -> CjImportStatus.run([]) end)

    assert output =~ "latest_status="
    refute Process.whereis(ProductCompare.Supervisor)
    refute Process.whereis(CJFeedDiscoveryScheduler)
    refute Process.whereis(CJProductImportScheduler)
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
