defmodule ProductCompare.CommerceAttribution.CJCommissionSyncDispatcherTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
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
