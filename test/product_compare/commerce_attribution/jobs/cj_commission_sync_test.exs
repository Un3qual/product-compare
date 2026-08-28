defmodule ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query

  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.CJCommissionSyncJobs
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  setup do
    restore_application_env(:cj_commission_sync_importer)
    restore_system_env("CJ_API_TOKEN")
    restore_system_env("CJ_ACCOUNT_ID")
    restore_system_env("CJ_COMMISSION_PUBLISHER_IDS")

    System.put_env("CJ_API_TOKEN", "configured-test-token")
    System.put_env("CJ_ACCOUNT_ID", "publisher-1")
    System.delete_env("CJ_COMMISSION_PUBLISHER_IDS")
    network_fixture("cj")

    :ok
  end

  test "worker arguments are bounded, canonical, and secret free" do
    args =
      CJCommissionSyncWorker.args(
        publisher_ids: [" publisher-1 ", "publisher-1"],
        from: ~U[2026-08-01 00:00:00.000000Z],
        before: ~U[2026-08-02 00:00:00Z],
        max_pages: 100,
        trigger: :operator,
        requested_by_user_id: 42
      )

    assert args == %{
             "before" => "2026-08-02T00:00:00Z",
             "from" => "2026-08-01T00:00:00Z",
             "max_pages" => 100,
             "publisher_ids" => ["publisher-1"],
             "requested_by_user_id" => 42,
             "schedule_window" => "2026-08-02T00:00:00Z",
             "trigger" => "operator"
           }

    refute Map.has_key?(args, "api_token")
    refute Map.has_key?(args, "authorization")
    refute inspect(args) =~ "configured-test-token"
  end

  test "Oban uniqueness covers active states but permits a terminal window replay" do
    opts = worker_opts()

    assert {:ok, first_job} = CJCommissionSyncWorker.enqueue(opts)
    assert {:ok, duplicate_job} = CJCommissionSyncWorker.enqueue(opts)
    assert duplicate_job.conflict?
    assert duplicate_job.id == first_job.id

    Repo.update_all(
      from(job in Oban.Job, where: job.id == ^first_job.id),
      set: [state: "completed", completed_at: ~U[2026-08-02 00:01:00Z]]
    )

    assert {:ok, replay_job} = CJCommissionSyncWorker.enqueue(opts)
    refute replay_job.conflict?
    refute replay_job.id == first_job.id
  end

  test "suspended work remains active and deduplicates through Oban's incomplete state group" do
    opts = worker_opts()
    assert {:ok, suspended_job} = CJCommissionSyncWorker.enqueue(opts)

    Repo.update_all(
      from(job in Oban.Job, where: job.id == ^suspended_job.id),
      set: [state: "suspended"]
    )

    assert %{state: "suspended"} = CJCommissionSyncJobs.active()
    assert {:ok, duplicate_job} = CJCommissionSyncWorker.enqueue(opts)
    assert duplicate_job.conflict?
    assert duplicate_job.id == suspended_job.id
  end

  test "worker reconstructs typed input and redacts retry and configuration failures" do
    parent = self()

    Application.put_env(:product_compare, :cj_commission_sync_importer, fn request, opts ->
      send(parent, {:import, request, opts})
      {:ok, %{id: 1}}
    end)

    args = CJCommissionSyncWorker.args(worker_opts())

    assert :ok =
             CJCommissionSyncWorker.perform(struct!(Oban.Job, id: 42, attempt: 2, args: args))

    assert_receive {:import, request, [oban_job_id: 42, oban_attempt: 2]}
    assert request.from == ~U[2026-08-01 00:00:00Z]
    assert request.before == ~U[2026-08-02 00:00:00Z]
    assert request.publisher_ids == ["publisher-1"]
    assert request.max_pages == 100
    assert request.trigger == :scheduled
    assert request.requested_by_user_id == nil

    Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
      {:error, {:missing_env, "CJ_API_TOKEN"}}
    end)

    assert {:cancel, "configuration_error"} =
             CJCommissionSyncWorker.perform(struct!(Oban.Job, args: args))

    Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
      {:error, {:transport_error, "secret provider body"}}
    end)

    assert {:error, "transient_provider_failure"} =
             CJCommissionSyncWorker.perform(struct!(Oban.Job, args: args))
  end

  test "worker retries only transient transport and provider availability failures" do
    for reason <- [
          {:transport_error, "secret transport details"},
          {:http_error, 408},
          {:http_error, 429},
          {:http_error, 500},
          {:http_error, 503},
          :runner_exception
        ] do
      Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
        {:error, reason}
      end)

      expected =
        if reason == :runner_exception, do: "runner_exception", else: "transient_provider_failure"

      assert {:error, ^expected} =
               CJCommissionSyncWorker.perform(
                 struct!(Oban.Job, args: CJCommissionSyncWorker.args(worker_opts()))
               )
    end
  end

  test "worker cancels deterministic CJ failures and preserves safe categories" do
    for {reason, category} <- [
          {{:invalid_response, :record}, "invalid_response"},
          {{:decode_error, :invalid_json}, "decode_error"},
          {{:graphql_error, "FORBIDDEN"}, "graphql_error"},
          {{:http_error, 400}, "http_error"},
          {{:http_error, 401}, "http_error"},
          {{:http_error, 403}, "http_error"},
          {{:http_error, 404}, "http_error"},
          {:page_ceiling_exhausted, "page_ceiling_exhausted"},
          {:unmatched_correction, "unmatched_correction"},
          {%Ecto.Changeset{}, "persistence_validation_failed"},
          {{:invalid_request, :max_pages}, "invalid_request"},
          {{:missing_env, "CJ_API_TOKEN"}, "configuration_error"},
          {{:authentication_failed, "provider secret"}, "authentication_error"},
          {{:authorization_failed, "provider secret"}, "authorization_error"}
        ] do
      Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
        {:error, reason}
      end)

      assert {:cancel, ^category} =
               CJCommissionSyncWorker.perform(
                 struct!(Oban.Job, args: CJCommissionSyncWorker.args(worker_opts()))
               )
    end
  end

  test "worker fails closed for malformed importer outcomes without exposing details" do
    Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
      {:error, {:provider_error, "provider secret"}}
    end)

    assert {:cancel, "provider_error"} =
             CJCommissionSyncWorker.perform(
               struct!(Oban.Job, args: CJCommissionSyncWorker.args(worker_opts()))
             )

    Application.put_env(:product_compare, :cj_commission_sync_importer, fn _request, _opts ->
      {:unexpected_provider_result, "provider secret"}
    end)

    assert {:cancel, "unexpected_runner_result"} =
             CJCommissionSyncWorker.perform(
               struct!(Oban.Job, args: CJCommissionSyncWorker.args(worker_opts()))
             )
  end

  test "active projects only safe fields and prioritizes executing work" do
    assert {:ok, executing_job} = CJCommissionSyncWorker.enqueue(worker_opts())

    assert {:ok, queued_job} =
             CJCommissionSyncWorker.enqueue(
               worker_opts(
                 from: ~U[2026-08-03 00:00:00Z],
                 before: ~U[2026-08-04 00:00:00Z]
               )
             )

    attempted_at = ~U[2026-08-02 00:00:30Z]

    Repo.update_all(
      from(job in Oban.Job, where: job.id == ^executing_job.id),
      set: [state: "executing", attempted_at: attempted_at]
    )

    assert %{state: "executing"} = active = CJCommissionSyncJobs.active()

    assert Map.keys(active) |> Enum.sort() ==
             [:attempted_at, :before, :from, :scheduled_at, :state]

    assert active.from == ~U[2026-08-01 00:00:00Z]
    assert active.before == ~U[2026-08-02 00:00:00Z]
    assert DateTime.compare(active.attempted_at, attempted_at) == :eq
    refute Map.has_key?(active, :args)
    refute inspect(active) =~ "publisher-1"
    assert queued_job.id > executing_job.id
  end

  test "run now deduplicates active work and permits a later run without shifting cadence" do
    now = ~U[2026-08-28 12:00:00Z]
    operator = AccountsFixtures.operator_fixture()

    assert {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

    assert {:ok, enabled} =
             Repo.transaction(fn ->
               settings = ConversionSyncSettings.lock_cj()

               {:ok, settings} =
                 ConversionSyncSettings.update_locked(
                   settings,
                   operator.id,
                   %{enabled: true, lookback_days: 7},
                   now
                 )

               settings
             end)

    next_run_at = enabled.next_run_at

    assert {:ok, %{job: first_job, existing: false}} =
             CJCommissionSyncJobs.run_now(operator.id, now)

    assert {:ok, %{job: same_job, existing: true}} =
             CJCommissionSyncJobs.run_now(operator.id, DateTime.add(now, 60, :second))

    assert same_job.id == first_job.id
    assert Repo.get!(ConversionSyncSetting, settings.id).next_run_at == next_run_at

    Repo.update_all(
      from(job in Oban.Job, where: job.id == ^first_job.id),
      set: [state: "completed", completed_at: DateTime.add(now, 120, :second)]
    )

    assert {:ok, %{job: later_job, existing: false}} =
             CJCommissionSyncJobs.run_now(operator.id, DateTime.add(now, 180, :second))

    refute later_job.id == first_job.id
    assert Repo.get!(ConversionSyncSetting, settings.id).next_run_at == next_run_at
  end

  test "run now fails closed for a non-operator" do
    user = AccountsFixtures.user_fixture()
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})
    worker = inspect(CJCommissionSyncWorker)

    count_before =
      Repo.aggregate(from(job in Oban.Job, where: job.worker == ^worker), :count, :id)

    assert {:error, :forbidden} =
             CJCommissionSyncJobs.run_now(user.id, ~U[2026-08-28 12:00:00Z])

    assert Repo.aggregate(from(job in Oban.Job, where: job.worker == ^worker), :count, :id) ==
             count_before
  end

  defp worker_opts(overrides \\ []) do
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

  defp restore_application_env(key) do
    previous = Application.get_env(:product_compare, key, :not_set)

    on_exit(fn ->
      case previous do
        :not_set -> Application.delete_env(:product_compare, key)
        value -> Application.put_env(:product_compare, key, value)
      end
    end)
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
