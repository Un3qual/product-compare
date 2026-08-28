defmodule ProductCompare.CommerceAttribution.CJCommissionSyncDispatcherTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query

  import ProductCompare.DatabaseTestHelpers,
    only: [assert_blocked_by: 2, hold_row_lock: 3, release_row_lock: 1, start_unboxed_action: 1]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher
  alias ProductCompare.CommerceAttribution.ConversionSyncRuns
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  setup do
    restore_system_env("CJ_API_TOKEN")
    restore_system_env("CJ_ACCOUNT_ID")
    restore_system_env("CJ_COMMISSION_PUBLISHER_IDS")

    System.put_env("CJ_API_TOKEN", "configured-test-token")
    System.put_env("CJ_ACCOUNT_ID", "publisher-1")
    System.delete_env("CJ_COMMISSION_PUBLISHER_IDS")
    network_fixture("cj")

    :ok
  end

  test "disabled and early settings remain idle without invoking the enqueuer" do
    now = ~U[2026-08-28 12:00:00Z]
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})
    flunking_enqueuer = fn _opts -> flunk("idle settings must not enqueue") end

    assert {:ok, :idle} = ConversionSyncSettings.claim_due_cj(now, flunking_enqueuer)

    enable_settings!(DateTime.add(now, 60, :second))
    assert {:ok, :idle} = ConversionSyncSettings.claim_due_cj(now, flunking_enqueuer)
  end

  test "a due claim uses the claim-time window, advances once, and never catches up" do
    now = ~U[2026-08-28 12:00:00Z]

    settings =
      enable_settings!(~U[2026-01-01 00:00:00Z],
        interval_minutes: 30,
        lookback_days: 7,
        max_pages: 5
      )

    assert {:ok, %{job: job, settings: advanced}} =
             ConversionSyncSettings.claim_due_cj(now, &CJCommissionSyncWorker.enqueue/1)

    assert job.args["from"] == "2026-08-21T12:00:00Z"
    assert job.args["before"] == "2026-08-28T12:00:00Z"
    assert job.args["max_pages"] == 5
    assert job.args["trigger"] == "scheduled"
    assert job.args["requested_by_user_id"] == nil
    assert job.args["schedule_window"] == "2026-08-28T12:00:00Z"
    assert advanced.id == settings.id
    assert DateTime.compare(advanced.next_run_at, ~U[2026-08-28 12:30:00Z]) == :eq

    assert {:ok, :idle} =
             ConversionSyncSettings.claim_due_cj(now, &CJCommissionSyncWorker.enqueue/1)

    assert Repo.aggregate(
             from(job in Oban.Job, where: job.worker == ^inspect(CJCommissionSyncWorker)),
             :count,
             :id
           ) == 1
  end

  test "an enqueue failure rolls back the cadence advance" do
    now = ~U[2026-08-28 12:00:00Z]
    original_next_run_at = ~U[2026-08-28 11:00:00Z]
    settings = enable_settings!(original_next_run_at)

    changeset =
      %Oban.Job{}
      |> Ecto.Changeset.change()
      |> Ecto.Changeset.add_error(:args, "rejected by test enqueuer")

    assert {:error, ^changeset} =
             ConversionSyncSettings.claim_due_cj(now, fn _opts -> {:error, changeset} end)

    assert DateTime.compare(
             Repo.get!(ConversionSyncSetting, settings.id).next_run_at,
             original_next_run_at
           ) == :eq
  end

  test "two database claimants produce one job" do
    now = ~U[2026-08-28 12:00:00Z]
    settings = committed_due_settings!(now)
    on_exit(fn -> delete_committed_claim_fixture(settings.id) end)
    parent = self()

    first =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          ConversionSyncSettings.claim_due_cj(now, fn opts ->
            result = CJCommissionSyncWorker.enqueue(opts)
            send(parent, {:first_enqueue_inserted, self()})

            receive do
              :commit_claim -> result
            after
              5_000 -> flunk("timed out waiting to commit the first claim")
            end
          end)
        end)
      end)

    assert_receive {:first_enqueue_inserted, first_pid}, 2_000
    assert first_pid == first.pid

    second =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          ConversionSyncSettings.claim_due_cj(now, fn _opts ->
            flunk("a skipped locked row must not enqueue")
          end)
        end)
      end)

    assert {:ok, {:ok, :idle}} = Task.yield(second, 1_000)
    send(first.pid, :commit_claim)
    assert {:ok, %{job: %Oban.Job{}, settings: %ConversionSyncSetting{}}} = Task.await(first)

    assert Sandbox.unboxed_run(Repo, fn ->
             Repo.aggregate(
               from(job in Oban.Job,
                 where: job.worker == ^inspect(CJCommissionSyncWorker)
               ),
               :count,
               :id
             )
           end) == 1
  end

  test "SKIP LOCKED returns idle instead of waiting for the due row" do
    now = ~U[2026-08-28 12:00:00Z]
    settings = committed_due_settings!(now)
    on_exit(fn -> delete_committed_claim_fixture(settings.id) end)
    parent = self()

    lock_holder =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          Repo.transaction(fn ->
            Repo.one!(
              from setting in ConversionSyncSetting,
                where: setting.id == ^settings.id,
                lock: "FOR UPDATE"
            )

            send(parent, {:settings_lock_held, self()})

            receive do
              :release_settings -> :ok
            after
              5_000 -> flunk("timed out waiting to release settings")
            end
          end)
        end)
      end)

    assert_receive {:settings_lock_held, lock_pid}, 2_000
    assert lock_pid == lock_holder.pid

    claim =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          ConversionSyncSettings.claim_due_cj(now, fn _opts ->
            flunk("a skipped locked row must not enqueue")
          end)
        end)
      end)

    assert {:ok, {:ok, :idle}} = Task.yield(claim, 1_000)
    send(lock_holder.pid, :release_settings)
    assert {:ok, :ok} = Task.await(lock_holder)
  end

  test "the supervised dispatcher bootstraps once and always schedules fixed 60-second ticks" do
    Repo.delete_all(ConversionSyncSetting)
    parent = self()

    scheduler = fn recipient, message, delay_ms ->
      send(parent, {:scheduled, recipient, message, delay_ms})
      make_ref()
    end

    pid =
      start_supervised!(
        {CJCommissionSyncDispatcher,
         name: :cj_commission_sync_dispatcher_test,
         scheduler: scheduler,
         clock: fn -> ~U[2026-08-28 12:00:00Z] end,
         defaults: %{interval_minutes: 60, lookback_days: 7, max_pages: 5}}
      )

    assert_receive {:scheduled, ^pid, :dispatch_due, 60_000}

    assert %ConversionSyncSetting{
             enabled: false,
             interval_minutes: 60,
             lookback_days: 7,
             max_pages: 5
           } = Repo.one!(ConversionSyncSetting)

    send(pid, :dispatch_due)
    :sys.get_state(pid)
    assert_receive {:scheduled, ^pid, :dispatch_due, 60_000}
  end

  test "the application-supervised dispatcher uses the test scheduler without arming a tick" do
    scheduler =
      :product_compare
      |> Application.fetch_env!(:cj_commission_sync_dispatcher)
      |> Keyword.fetch!(:scheduler)

    pid = Process.whereis(CJCommissionSyncDispatcher)

    assert is_pid(pid)
    assert %{scheduler: ^scheduler} = :sys.get_state(pid)
    assert is_reference(scheduler.(self(), :unexpected_dispatch_due, 0))
    refute_receive :unexpected_dispatch_due
  end

  test "Oban production configuration enables the default 60-minute Lifeline" do
    plugins =
      :product_compare
      |> Application.fetch_env!(Oban)
      |> Keyword.fetch!(:plugins)

    assert Oban.Plugins.Lifeline in plugins
  end

  test "a dispatcher tick interrupts non-executing or missing jobs but leaves live and CLI runs" do
    now = ~U[2026-08-28 12:00:00Z]
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    assert {:ok, executing_job} =
             CJCommissionSyncWorker.enqueue(
               worker_opts(schedule_window: ~U[2026-08-02 00:00:00Z])
             )

    assert {:ok, available_job} =
             CJCommissionSyncWorker.enqueue(
               worker_opts(schedule_window: ~U[2026-08-03 00:00:00Z])
             )

    Repo.update_all(
      from(job in Oban.Job, where: job.id == ^executing_job.id),
      set: [state: "executing", attempted_at: DateTime.add(now, -60, :second)]
    )

    live_run = start_run!(oban_job_id: executing_job.id, oban_attempt: 1)
    available_run = start_run!(oban_job_id: available_job.id, oban_attempt: 1)
    missing_run = start_run!(oban_job_id: 9_000_000_000, oban_attempt: 1)
    cli_run = start_run!(trigger: :cli)

    assert {:ok, :idle} =
             CJCommissionSyncDispatcher.dispatch_due(now, fn _opts ->
               flunk("disabled settings must not enqueue")
             end)

    assert Repo.get!(ConversionSyncRun, live_run.id).status == :running

    for run <- [available_run, missing_run] do
      interrupted = Repo.get!(ConversionSyncRun, run.id)
      assert interrupted.status == :failed
      assert interrupted.error_summary == "worker_interrupted"
      assert DateTime.compare(interrupted.finished_at, now) == :eq
    end

    assert Repo.get!(ConversionSyncRun, cli_run.id).status == :running
  end

  test "reconciliation locks the Oban row before preserving a live executing attempt" do
    now = ~U[2026-08-28 12:00:00Z]

    {job, run} =
      Sandbox.unboxed_run(Repo, fn ->
        assert {:ok, job} =
                 CJCommissionSyncWorker.enqueue(
                   worker_opts(schedule_window: ~U[2026-08-04 00:00:00Z])
                 )

        Repo.update_all(
          from(current_job in Oban.Job, where: current_job.id == ^job.id),
          set: [state: "executing", attempted_at: DateTime.add(now, -60, :second)]
        )

        {job, start_run!(oban_job_id: job.id, oban_attempt: 1)}
      end)

    on_exit(fn -> delete_committed_reconciliation_fixture(job.id, run.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(Oban.Job, job.id, fn locked_job ->
        locked_job
        |> Ecto.Changeset.change(state: "executing")
        |> Repo.update!()
      end)

    {reconciler, reconciler_backend_pid} =
      start_unboxed_action(fn ->
        CJCommissionSyncDispatcher.dispatch_due(now, fn _opts ->
          flunk("missing settings must not enqueue")
        end)
      end)

    assert_blocked_by(reconciler_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)
    assert {:ok, :idle} = Task.await(reconciler)
    assert Repo.get!(ConversionSyncRun, run.id).status == :running
  end

  defp enable_settings!(next_run_at, overrides \\ []) do
    assert {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

    attrs =
      overrides
      |> Map.new()
      |> Map.merge(%{enabled: true, next_run_at: next_run_at})

    settings
    |> ConversionSyncSetting.changeset(attrs)
    |> Repo.update!()
  end

  defp start_run!(overrides) do
    attrs =
      Map.merge(
        %{
          affiliate_network_id: network_fixture("cj").id,
          trigger: :operator,
          window_start: ~U[2026-08-01 00:00:00Z],
          window_end: ~U[2026-08-02 00:00:00Z],
          oban_job_id: nil,
          oban_attempt: nil
        },
        Map.new(overrides)
      )

    assert {:ok, run} = ConversionSyncRuns.start(attrs, ~U[2026-08-28 11:00:00Z])
    run
  end

  defp committed_due_settings!(now) do
    Sandbox.unboxed_run(Repo, fn ->
      network = network_fixture("cj")

      Repo.delete_all(
        from job in Oban.Job,
          where: job.worker == ^inspect(CJCommissionSyncWorker)
      )

      Repo.delete_all(
        from setting in ConversionSyncSetting,
          where: setting.affiliate_network_id == ^network.id
      )

      assert {:ok, settings} =
               ConversionSyncSettings.ensure_cj(%{
                 interval_minutes: 30,
                 lookback_days: 7,
                 max_pages: 5
               })

      settings
      |> ConversionSyncSetting.changeset(%{
        enabled: true,
        next_run_at: DateTime.add(now, -60, :second)
      })
      |> Repo.update!()
    end)
  end

  defp delete_committed_claim_fixture(settings_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(
        from job in Oban.Job,
          where: job.worker == ^inspect(CJCommissionSyncWorker)
      )

      Repo.delete_all(
        from setting in ConversionSyncSetting,
          where: setting.id == ^settings_id
      )
    end)
  end

  defp delete_committed_reconciliation_fixture(job_id, run_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from run in ConversionSyncRun, where: run.id == ^run_id)
      Repo.delete_all(from job in Oban.Job, where: job.id == ^job_id)
    end)
  end

  defp worker_opts(overrides) do
    Keyword.merge(
      [
        publisher_ids: ["publisher-1"],
        from: ~U[2026-08-01 00:00:00Z],
        before: ~U[2026-08-02 00:00:00Z],
        max_pages: 100,
        trigger: :scheduled,
        requested_by_user_id: nil
      ],
      overrides
    )
  end

  defp network_fixture(code) do
    case Repo.get_by(AffiliateNetwork, code: code) do
      %AffiliateNetwork{} = network ->
        network

      nil ->
        {:ok, network} = Affiliate.upsert_network(%{code: code, name: String.upcase(code)})
        network
    end
  end

  defp restore_system_env(name) do
    previous = System.get_env(name)

    on_exit(fn ->
      case previous do
        nil -> System.delete_env(name)
        value -> System.put_env(name, value)
      end
    end)
  end
end
