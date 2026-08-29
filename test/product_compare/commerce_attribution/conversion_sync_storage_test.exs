defmodule ProductCompare.CommerceAttribution.ConversionSyncStorageTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_queries: 1]

  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution.ConversionSyncRuns
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.CJActionCorrection
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  setup do
    Repo.delete_all(ConversionSyncSetting)
    :ok
  end

  test "settings enforce the approved bounds and disabled next-run contract" do
    valid = %{
      affiliate_network_id: network_fixture("cj").id,
      enabled: false,
      interval_minutes: 1_440,
      lookback_days: 90,
      max_pages: 100,
      next_run_at: nil
    }

    assert ConversionSyncSetting.changeset(%ConversionSyncSetting{}, valid).valid?

    for {field, value} <- [
          interval_minutes: 14,
          interval_minutes: 10_081,
          lookback_days: 0,
          lookback_days: 91,
          max_pages: 0,
          max_pages: 101
        ] do
      refute ConversionSyncSetting.changeset(
               %ConversionSyncSetting{},
               Map.put(valid, field, value)
             ).valid?
    end

    refute ConversionSyncSetting.changeset(
             %ConversionSyncSetting{},
             %{valid | next_run_at: ~U[2026-08-28 12:00:00Z]}
           ).valid?
  end

  test "terminal run evidence requires an increasing window, nonnegative counts, and finish time" do
    attrs = run_attrs(%{status: :succeeded, finished_at: nil})

    assert %{finished_at: ["is invalid"]} =
             errors_on(ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs))

    attrs = run_attrs(%{window_end: attrs.window_start})

    assert %{window_end: ["must be after window start"]} =
             errors_on(ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs))

    for field <- [:pages_fetched, :records_fetched, :records_persisted, :records_failed] do
      changeset =
        ConversionSyncRun.changeset(%ConversionSyncRun{}, Map.put(run_attrs(), field, -1))

      refute changeset.valid?
      assert "must be greater than or equal to 0" in Map.fetch!(errors_on(changeset), field)
    end
  end

  test "run status, trigger, and error summary are constrained by the application" do
    for {field, value} <- [status: :unknown, trigger: :manual] do
      changeset =
        ConversionSyncRun.changeset(%ConversionSyncRun{}, Map.put(run_attrs(), field, value))

      refute changeset.valid?
      assert Map.has_key?(errors_on(changeset), field)
    end

    changeset =
      ConversionSyncRun.changeset(
        %ConversionSyncRun{},
        Map.put(run_attrs(), :error_summary, String.duplicate("e\u0301", 500))
      )

    refute changeset.valid?
    assert "must be 500 characters or fewer" in errors_on(changeset).error_summary
  end

  test "run Oban identity requires paired fields and a positive attempt" do
    for attrs <- [
          run_attrs(%{oban_job_id: 42, oban_attempt: nil}),
          run_attrs(%{oban_job_id: nil, oban_attempt: 1})
        ] do
      changeset = ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs)

      refute changeset.valid?
      assert Map.has_key?(errors_on(changeset), :oban_job_id)
      assert Map.has_key?(errors_on(changeset), :oban_attempt)
    end

    changeset =
      ConversionSyncRun.changeset(
        %ConversionSyncRun{},
        run_attrs(%{oban_job_id: 42, oban_attempt: 0})
      )

    refute changeset.valid?
    assert "must be greater than 0" in errors_on(changeset).oban_attempt

    assert ConversionSyncRun.changeset(
             %ConversionSyncRun{},
             run_attrs(%{oban_job_id: nil, oban_attempt: nil})
           ).valid?

    assert ConversionSyncRun.changeset(
             %ConversionSyncRun{},
             run_attrs(%{oban_job_id: 42, oban_attempt: 1})
           ).valid?
  end

  test "commerce conversions accept a nullable network action reference" do
    network = network_fixture("cj")

    changeset =
      CommerceConversion.changeset(%CommerceConversion{}, %{
        source_network: "cj",
        affiliate_network_id: network.id,
        network_conversion_ref: "conversion-#{System.unique_integer([:positive])}",
        network_action_ref: nil,
        status: :pending,
        currency: "USD",
        attribution_confidence: :unmatched,
        reported_at: ~U[2026-08-28 12:00:00Z]
      })

    assert changeset.valid?
  end

  test "CJ action correction evidence validates its durable action identity and payload" do
    attrs = %{
      affiliate_network_id: network_fixture("cj").id,
      network_action_ref: "action-1",
      network_correction_ref: "correction-1",
      posting_date: ~U[2026-08-28 12:00:00Z],
      raw_payload: %{"original" => false}
    }

    assert CJActionCorrection.changeset(%CJActionCorrection{}, attrs).valid?

    for {field, value} <- [network_action_ref: " ", network_correction_ref: " "] do
      changeset =
        CJActionCorrection.changeset(%CJActionCorrection{}, Map.put(attrs, field, value))

      refute changeset.valid?
      assert "can't be blank" in Map.fetch!(errors_on(changeset), field)
    end

    for raw_payload <- [%{}, %{"original" => true}, %{"original" => "false"}] do
      changeset =
        CJActionCorrection.changeset(
          %CJActionCorrection{},
          %{attrs | raw_payload: raw_payload}
        )

      refute changeset.valid?
      assert "must identify a correction" in errors_on(changeset).raw_payload
    end
  end

  test "ensure_cj converges to one row and preserves persisted operator settings" do
    assert {:ok, first} =
             ConversionSyncSettings.ensure_cj(%{
               interval_minutes: 60,
               lookback_days: 7,
               max_pages: 5
             })

    assert first.enabled == false
    assert first.interval_minutes == 60
    assert first.lookback_days == 7
    assert first.max_pages == 5
    assert first.next_run_at == nil

    assert {:ok, second} = ConversionSyncSettings.ensure_cj(%{})
    assert second.id == first.id
    assert second.interval_minutes == 60
    assert second.lookback_days == 7
    assert second.max_pages == 5
    assert Repo.aggregate(ConversionSyncSetting, :count, :id) == 1
  end

  test "ensure_cj locks the CJ network while bootstrapping its settings" do
    {_result, queries} =
      capture_queries(fn -> ConversionSyncSettings.ensure_cj(%{}) end)

    assert Enum.any?(queries, fn query ->
             String.contains?(query, ~s(FOR UPDATE)) and
               String.contains?(query, ~s(FROM "affiliate_networks"))
           end)
  end

  test "get_cj reads persisted settings with one unlocked query" do
    assert {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

    {result, queries} = capture_queries(fn -> ConversionSyncSettings.get_cj() end)

    assert %ConversionSyncSetting{id: setting_id} = result
    assert setting_id == settings.id
    assert [query] = queries
    assert String.starts_with?(String.trim_leading(query), "SELECT")
    assert String.contains?(query, ~s(FROM "commerce_conversion_sync_settings"))
    assert String.contains?(query, ~s(JOIN "affiliate_networks"))
    refute String.contains?(query, "FOR UPDATE")
    refute Regex.match?(~r/^\s*(INSERT|UPDATE|DELETE)/i, query)
  end

  test "get_cj returns nil when CJ settings or network is absent" do
    assert ConversionSyncSettings.get_cj() == nil

    network_fixture("cj")

    assert ConversionSyncSettings.get_cj() == nil
  end

  test "context owners accept string-keyed input maps" do
    assert {:ok, setting} =
             ConversionSyncSettings.ensure_cj(%{
               "interval_minutes" => 60,
               "lookback_days" => 7,
               "max_pages" => 5
             })

    assert setting.interval_minutes == 60
    assert setting.lookback_days == 7
    assert setting.max_pages == 5

    assert {:ok, run} =
             ConversionSyncRuns.start(
               string_keyed(run_attrs(%{status: "failed"})),
               ~U[2026-08-28 12:00:00Z]
             )

    assert run.status == :running
  end

  test "lock_cj requires a transaction and returns the CJ settings row when locked" do
    assert {:ok, settings} = ConversionSyncSettings.ensure_cj(%{})

    assert_raise ArgumentError, ~r/lock_cj\/0 requires a database transaction/, fn ->
      ConversionSyncSettings.lock_cj()
    end

    settings_id = settings.id

    assert {:ok, locked} =
             Repo.transaction(fn ->
               assert %ConversionSyncSetting{id: ^settings_id} = ConversionSyncSettings.lock_cj()
             end)

    assert locked.id == settings.id
  end

  test "locked settings updates assign operators and maintain next-run cadence" do
    now = ~U[2026-08-28 12:00:00Z]
    operator = AccountsFixtures.user_fixture()
    assert {:ok, _settings} = ConversionSyncSettings.ensure_cj(%{})

    assert {:ok, enabled} =
             Repo.transaction(fn ->
               settings = ConversionSyncSettings.lock_cj()

               assert {:ok, updated} =
                        ConversionSyncSettings.update_locked(
                          settings,
                          operator.id,
                          %{enabled: true},
                          now
                        )

               updated
             end)

    assert enabled.enabled
    assert enabled.updated_by_user_id == operator.id
    assert DateTime.compare(enabled.next_run_at, DateTime.add(now, 1_440 * 60, :second)) == :eq

    preserved_next_run_at = enabled.next_run_at

    assert {:ok, changed_lookback} =
             Repo.transaction(fn ->
               settings = ConversionSyncSettings.lock_cj()

               assert {:ok, updated} =
                        ConversionSyncSettings.update_locked(
                          settings,
                          operator.id,
                          %{lookback_days: 30},
                          DateTime.add(now, 1, :second)
                        )

               updated
             end)

    assert changed_lookback.lookback_days == 30
    assert DateTime.compare(changed_lookback.next_run_at, preserved_next_run_at) == :eq

    assert {:ok, changed_interval} =
             Repo.transaction(fn ->
               settings = ConversionSyncSettings.lock_cj()

               assert {:ok, updated} =
                        ConversionSyncSettings.update_locked(
                          settings,
                          operator.id,
                          %{interval_minutes: 30},
                          now
                        )

               updated
             end)

    assert DateTime.compare(changed_interval.next_run_at, DateTime.add(now, 30 * 60, :second)) ==
             :eq

    assert {:ok, disabled} =
             Repo.transaction(fn ->
               settings = ConversionSyncSettings.lock_cj()

               assert {:ok, updated} =
                        ConversionSyncSettings.update_locked(
                          settings,
                          operator.id,
                          %{enabled: false},
                          now
                        )

               updated
             end)

    refute disabled.enabled
    assert disabled.next_run_at == nil
  end

  test "run lifecycle starts running, completes once, and lists newest first" do
    now = ~U[2026-08-28 12:00:00Z]
    network = network_fixture("cj")

    assert {:ok, first} =
             ConversionSyncRuns.start(
               run_attrs(%{affiliate_network_id: network.id, status: :failed}),
               now
             )

    assert first.status == :running
    assert DateTime.compare(first.started_at, now) == :eq

    assert {:ok, completed} =
             ConversionSyncRuns.complete(
               first,
               %{status: :succeeded, pages_fetched: 2, records_fetched: 3, records_persisted: 3},
               DateTime.add(now, 60, :second)
             )

    assert completed.status == :succeeded
    assert DateTime.compare(completed.finished_at, DateTime.add(now, 60, :second)) == :eq
    assert completed.pages_fetched == 2
    assert completed.records_fetched == 3

    assert {:ok, unchanged} =
             ConversionSyncRuns.complete(
               completed,
               %{status: :failed, error_summary: "late update"},
               DateTime.add(now, 120, :second)
             )

    assert unchanged.id == completed.id
    assert unchanged.status == :succeeded
    assert unchanged.error_summary == nil

    assert {:ok, second} =
             ConversionSyncRuns.start(
               run_attrs(%{
                 affiliate_network_id: network.id,
                 started_at: DateTime.add(now, 1, :second)
               }),
               DateTime.add(now, 1, :second)
             )

    assert [^second, ^completed] = Repo.all(ConversionSyncRuns.query())
  end

  test "starting a retried Oban attempt atomically interrupts an older running attempt" do
    first_started_at = ~U[2026-08-28 12:00:00Z]
    retry_started_at = DateTime.add(first_started_at, 60, :second)

    assert {:ok, first} =
             ConversionSyncRuns.start(
               run_attrs(%{oban_job_id: 42, oban_attempt: 1}),
               first_started_at
             )

    assert {:ok, retry} =
             ConversionSyncRuns.start(
               run_attrs(%{oban_job_id: 42, oban_attempt: 2}),
               retry_started_at
             )

    interrupted = Repo.get!(ConversionSyncRun, first.id)

    assert interrupted.status == :failed
    assert interrupted.error_summary == "worker_interrupted"
    assert DateTime.compare(interrupted.finished_at, retry_started_at) == :eq
    assert Map.get(interrupted, :oban_job_id) == 42
    assert Map.get(interrupted, :oban_attempt) == 1

    assert retry.status == :running
    assert Map.get(retry, :oban_job_id) == 42
    assert Map.get(retry, :oban_attempt) == 2
  end

  test "run completion updates terminal evidence without recasting run identity" do
    now = ~U[2026-08-28 12:00:00Z]
    network = network_fixture("cj")

    assert {:ok, run} =
             ConversionSyncRuns.start(
               run_attrs(%{affiliate_network_id: network.id}),
               now
             )

    assert {:ok, completed} =
             ConversionSyncRuns.complete(
               run,
               %{
                 status: :succeeded,
                 window_start: ~U[2026-08-27 00:00:00Z],
                 cursor: "cursor-2",
                 records_fetched: 2
               },
               DateTime.add(now, 60, :second)
             )

    assert completed.window_start == run.window_start
    assert completed.affiliate_network_id == run.affiliate_network_id
    assert completed.trigger == run.trigger
    assert completed.started_at == run.started_at
    assert completed.cursor == "cursor-2"
    assert completed.records_fetched == 2
  end

  test "failed run evidence stores only the caller's bounded category summary" do
    now = ~U[2026-08-28 12:00:00Z]

    assert {:ok, run} = ConversionSyncRuns.start(run_attrs(), now)

    assert {:ok, completed} =
             ConversionSyncRuns.complete(
               run,
               %{
                 status: :failed,
                 pages_fetched: 1,
                 records_fetched: 2,
                 records_persisted: 1,
                 records_failed: 1,
                 error_summary: "unmatched_correction"
               },
               DateTime.add(now, 1, :second)
             )

    assert completed.status == :failed
    assert completed.error_summary == "unmatched_correction"

    assert completed.records_fetched ==
             completed.records_persisted + completed.records_failed
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

  defp string_keyed(attrs) do
    Map.new(attrs, fn {key, value} -> {Atom.to_string(key), value} end)
  end

  defp run_attrs(overrides \\ %{}) do
    Map.merge(
      %{
        affiliate_network_id: network_fixture("cj").id,
        status: :running,
        trigger: :operator,
        requested_by_user_id: nil,
        window_start: ~U[2026-08-28 00:00:00Z],
        window_end: ~U[2026-08-29 00:00:00Z],
        cursor: "cursor-1",
        pages_fetched: 0,
        records_fetched: 0,
        records_persisted: 0,
        records_failed: 0,
        started_at: ~U[2026-08-28 12:00:00Z],
        finished_at: ~U[2026-08-28 12:01:00Z],
        error_summary: nil
      },
      overrides
    )
  end
end
