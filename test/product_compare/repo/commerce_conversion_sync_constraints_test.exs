defmodule ProductCompare.Repo.CommerceConversionSyncConstraintsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Affiliate
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  setup do
    Repo.delete_all(ConversionSyncSetting)
    :ok
  end

  test "settings reject each named database check violation" do
    network_id = network_fixture("cj").id

    assert_check_violation(
      insert_setting(network_id, enabled: true, interval_minutes: 14),
      "commerce_conversion_sync_settings_interval_bounds"
    )

    assert_check_violation(
      insert_setting(network_id, enabled: true, lookback_days: 91),
      "commerce_conversion_sync_settings_lookback_bounds"
    )

    assert_check_violation(
      insert_setting(network_id, enabled: true, max_pages: 101),
      "commerce_conversion_sync_settings_max_pages_bounds"
    )

    assert_check_violation(
      insert_setting(network_id, enabled: false, next_run_at: ~U[2026-08-28 12:00:00Z]),
      "commerce_conversion_sync_settings_enabled_next_run"
    )
  end

  test "sync runs reject each named database check violation" do
    network_id = network_fixture("cj").id

    assert_native_enum_rejection(insert_run(network_id, status: "paused"))
    assert_native_enum_rejection(insert_run(network_id, trigger: "manual"))

    assert_check_violation(
      insert_run(network_id, window_end: ~U[2026-08-28 00:00:00Z]),
      "commerce_conversion_sync_runs_window_increasing"
    )

    assert_check_violation(
      insert_run(network_id, records_failed: -1),
      "commerce_conversion_sync_runs_counts_non_negative"
    )

    assert_check_violation(
      insert_run(network_id, status: "failed", finished_at: nil),
      "commerce_conversion_sync_runs_terminal_finished_at_required"
    )

    assert_check_violation(
      insert_run(network_id, error_summary: String.duplicate("x", 501)),
      "commerce_conversion_sync_runs_error_summary_length"
    )
  end

  test "direct SQL accepts valid settings and run evidence" do
    network_id = network_fixture("cj").id

    assert {:ok, _settings} = insert_setting(network_id)
    assert {:ok, _run} = insert_run(network_id)
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

  defp insert_setting(network_id, overrides \\ []) do
    values =
      Map.merge(
        %{
          enabled: false,
          interval_minutes: 1_440,
          lookback_days: 90,
          max_pages: 100,
          next_run_at: nil
        },
        Map.new(overrides)
      )

    Repo.query(
      """
      INSERT INTO commerce_conversion_sync_settings (
        affiliate_network_id, enabled, interval_minutes, lookback_days, max_pages,
        next_run_at, inserted_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      """,
      [
        network_id,
        values.enabled,
        values.interval_minutes,
        values.lookback_days,
        values.max_pages,
        values.next_run_at
      ]
    )
  end

  defp insert_run(network_id, overrides \\ []) do
    values =
      Map.merge(
        %{
          entropy_id: Ecto.UUID.dump!(Ecto.UUID.generate()),
          status: "running",
          trigger: "operator",
          window_start: ~U[2026-08-28 00:00:00Z],
          window_end: ~U[2026-08-29 00:00:00Z],
          cursor: "cursor-1",
          pages_fetched: 0,
          records_fetched: 0,
          records_persisted: 0,
          records_failed: 0,
          started_at: ~U[2026-08-28 12:00:00Z],
          finished_at: nil,
          error_summary: nil
        },
        Map.new(overrides)
      )

    Repo.query(
      """
      INSERT INTO commerce_conversion_sync_runs (
        entropy_id, affiliate_network_id, status, "trigger", window_start, window_end,
        cursor, pages_fetched, records_fetched, records_persisted, records_failed,
        started_at, finished_at, error_summary, inserted_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now())
      """,
      [
        values.entropy_id,
        network_id,
        values.status,
        values.trigger,
        values.window_start,
        values.window_end,
        values.cursor,
        values.pages_fetched,
        values.records_fetched,
        values.records_persisted,
        values.records_failed,
        values.started_at,
        values.finished_at,
        values.error_summary
      ]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end

  test "native enum fields do not use redundant status or trigger checks" do
    result =
      Repo.query!("""
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'commerce_conversion_sync_runs'::regclass
        AND conname IN (
          'commerce_conversion_sync_runs_status_valid',
          'commerce_conversion_sync_runs_trigger_valid'
        )
      ORDER BY conname
      """)

    assert result.rows == []
  end

  defp assert_native_enum_rejection(result) do
    assert {:error, %Postgrex.Error{postgres: %{code: :invalid_text_representation}}} = result
  end
end
