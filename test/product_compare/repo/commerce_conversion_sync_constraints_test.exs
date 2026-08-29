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

    for overrides <- [[oban_job_id: 42], [oban_attempt: 1]] do
      assert_check_violation(
        insert_run(network_id, overrides),
        "commerce_conversion_sync_runs_oban_identity_paired"
      )
    end

    assert_check_violation(
      insert_run(network_id, oban_job_id: 42, oban_attempt: 0),
      "commerce_conversion_sync_runs_oban_attempt_positive"
    )
  end

  test "database writes accept valid settings and run evidence" do
    network_id = network_fixture("cj").id

    assert {:ok, _settings} = insert_setting(network_id)
    assert {:ok, _run} = insert_run(network_id)
  end

  test "CJ action correction evidence rejects malformed action identity and payload" do
    network_id = network_fixture("cj").id

    assert_check_violation(
      insert_action_correction(network_id, network_action_ref: " "),
      "commerce_cj_action_corrections_action_ref_nonblank"
    )

    assert_check_violation(
      insert_action_correction(network_id, network_correction_ref: " "),
      "commerce_cj_action_corrections_correction_ref_nonblank"
    )

    for raw_payload <- [%{}, %{"original" => true}, %{"original" => "false"}] do
      assert_check_violation(
        insert_action_correction(network_id, raw_payload: raw_payload),
        "commerce_cj_action_corrections_payload_is_correction"
      )
    end
  end

  test "database writes accept valid CJ action correction evidence" do
    assert {:ok, _result} = insert_action_correction(network_fixture("cj").id)
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
    now = DateTime.utc_now()

    values =
      Map.merge(
        %{
          affiliate_network_id: network_id,
          enabled: false,
          interval_minutes: 1_440,
          lookback_days: 90,
          max_pages: 100,
          next_run_at: nil,
          inserted_at: now,
          updated_at: now
        },
        Map.new(overrides)
      )

    insert_all("commerce_conversion_sync_settings", values)
  end

  defp insert_run(network_id, overrides \\ []) do
    now = DateTime.utc_now()

    values =
      Map.merge(
        %{
          entropy_id: Ecto.UUID.dump!(Ecto.UUID.generate()),
          affiliate_network_id: network_id,
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
          error_summary: nil,
          oban_job_id: nil,
          oban_attempt: nil,
          inserted_at: now,
          updated_at: now
        },
        Map.new(overrides)
      )

    insert_all("commerce_conversion_sync_runs", values)
  end

  defp insert_action_correction(network_id, overrides \\ []) do
    now = DateTime.utc_now()

    values =
      Map.merge(
        %{
          affiliate_network_id: network_id,
          network_action_ref: "action-#{Ecto.UUID.generate()}",
          network_correction_ref: "correction-#{Ecto.UUID.generate()}",
          posting_date: ~U[2026-08-28 12:00:00Z],
          raw_payload: %{"original" => false},
          inserted_at: now,
          updated_at: now
        },
        Map.new(overrides)
      )

    insert_all("commerce_cj_action_corrections", values)
  end

  defp insert_all(table, values) do
    {:ok, Repo.insert_all(table, [values])}
  rescue
    error in Postgrex.Error -> {:error, error}
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end

  defp assert_native_enum_rejection(result) do
    assert {:error, %Postgrex.Error{postgres: %{code: :invalid_text_representation}}} = result
  end
end
