defmodule ProductCompare.Ingestion.Jobs.DurableJobsTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker
  alias ProductCompare.Ingestion.Jobs.CJProductImportWorker
  alias ProductCompare.Repo

  setup do
    restore_env(:cj_product_import_job_runner)
    restore_env(:cj_feed_discovery_job_runner)
    :ok
  end

  test "product imports enqueue normalized non-secret unique jobs" do
    refute CJProductImportWorker.args(schedule_window: "default-window")["complete_scope"]

    opts = [
      complete_scope: true,
      currency: "usd",
      cursor: "invalid",
      keywords: "shoe, boot",
      limit: 0,
      pages: -1,
      schedule_window: "2026-07-13T18:00:00Z",
      serviceable_areas: "us, ca"
    ]

    assert {:ok, first_job} = CJProductImportWorker.enqueue(opts)

    assert first_job.args == %{
             "complete_scope" => true,
             "currency" => "USD",
             "cursor" => nil,
             "keywords" => ["shoe", "boot"],
             "limit" => 25,
             "pages" => 1,
             "schedule_window" => "2026-07-13T18:00:00Z",
             "serviceable_areas" => ["US", "CA"]
           }

    assert {:ok, duplicate_job} = CJProductImportWorker.enqueue(opts)
    assert duplicate_job.conflict?
    assert duplicate_job.id == first_job.id
    assert Repo.get!(Oban.Job, first_job.id).args == first_job.args

    assert {:ok, later_window_job} =
             CJProductImportWorker.enqueue(
               Keyword.put(opts, :schedule_window, "2026-07-13T19:00:00Z")
             )

    refute later_window_job.conflict?
    refute later_window_job.id == first_job.id

    refute Map.has_key?(first_job.args, "api_token")
    refute Map.has_key?(first_job.args, "company_id")
  end

  test "product import jobs call the existing runner with safe normalized options" do
    parent = self()

    Application.put_env(:product_compare, :cj_product_import_job_runner, fn opts ->
      send(parent, {:product_import, opts})
      {:ok, %{persisted: 1}}
    end)

    args =
      CJProductImportWorker.args(
        complete_scope: true,
        currency: "usd",
        keywords: ["shoe"],
        serviceable_areas: ["us"],
        schedule_window: "window-1"
      )

    assert :ok = CJProductImportWorker.perform(struct!(Oban.Job, args: args))

    assert_receive {:product_import, opts}

    assert Map.new(opts) == %{
             complete_scope: true,
             currency: "USD",
             cursor: nil,
             keywords: ["shoe"],
             limit: 25,
             pages: 1,
             serviceable_areas: ["US"]
           }
  end

  test "workers return redacted retry and terminal categories" do
    Application.put_env(:product_compare, :cj_product_import_job_runner, fn _opts ->
      {:error, {:provider_error, "secret provider body"}}
    end)

    product_job =
      struct!(Oban.Job,
        args: CJProductImportWorker.args(schedule_window: "transient-window")
      )

    assert {:error, "transient_provider_failure"} =
             CJProductImportWorker.perform(product_job)

    Application.put_env(:product_compare, :cj_feed_discovery_job_runner, fn _opts ->
      {:error, {:missing_env, "CJ_API_TOKEN"}}
    end)

    feed_job =
      struct!(Oban.Job,
        args: CJFeedDiscoveryWorker.args(schedule_window: "terminal-window")
      )

    assert {:cancel, "configuration_error"} =
             CJFeedDiscoveryWorker.perform(feed_job)
  end

  test "feed discovery enqueues and performs normalized safe jobs" do
    parent = self()

    Application.put_env(:product_compare, :cj_feed_discovery_job_runner, fn opts ->
      send(parent, {:feed_discovery, opts})
      {:ok, %{candidates_persisted: 1}}
    end)

    assert {:ok, job} =
             CJFeedDiscoveryWorker.enqueue(
               advertiser_country: "ca",
               cursor: 40,
               limit: 10,
               pages: 2,
               schedule_window: "2026-07-13T18:00:00Z"
             )

    assert job.args == %{
             "advertiser_country" => "CA",
             "cursor" => 40,
             "limit" => 10,
             "pages" => 2,
             "schedule_window" => "2026-07-13T18:00:00Z"
           }

    assert :ok = CJFeedDiscoveryWorker.perform(struct!(Oban.Job, args: job.args))

    assert_receive {:feed_discovery, opts}

    assert Map.new(opts) == %{
             advertiser_country: "CA",
             cursor: 40,
             limit: 10,
             pages: 2
           }
  end

  test "feed discovery uniqueness is scoped to one scheduling window" do
    opts = [
      advertiser_country: "US",
      cursor: 40,
      limit: 10,
      pages: 2,
      schedule_window: "2026-07-13T18:00:00Z"
    ]

    assert {:ok, first_job} = CJFeedDiscoveryWorker.enqueue(opts)

    assert {:ok, duplicate_job} = CJFeedDiscoveryWorker.enqueue(opts)
    assert duplicate_job.conflict?
    assert duplicate_job.id == first_job.id

    assert {:ok, later_window_job} =
             CJFeedDiscoveryWorker.enqueue(
               Keyword.put(opts, :schedule_window, "2026-07-13T19:00:00Z")
             )

    refute later_window_job.conflict?
    refute later_window_job.id == first_job.id
  end

  defp restore_env(key) do
    previous = Application.get_env(:product_compare, key, :not_set)

    on_exit(fn ->
      case previous do
        :not_set -> Application.delete_env(:product_compare, key)
        value -> Application.put_env(:product_compare, key, value)
      end
    end)
  end
end
