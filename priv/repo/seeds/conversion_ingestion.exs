defmodule ProductCompare.DevSeeds.ConversionIngestion do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Conversions
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.CJActionCorrection
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @run_fields [
    :affiliate_network_id,
    :status,
    :trigger,
    :requested_by_user_id,
    :oban_job_id,
    :oban_attempt,
    :window_start,
    :window_end,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :started_at,
    :finished_at,
    :error_summary
  ]

  @spec seed!(map(), AffiliateNetwork.t(), CommerceConversion.t(), DateTime.t()) :: map()
  def seed!(accounts, network, reversed_conversion, %DateTime{} = anchor) do
    %{
      settings: seed_settings!(network, accounts.admin),
      runs: seed_runs!(network, accounts.admin, anchor),
      correction: seed_correction!(network, reversed_conversion)
    }
  end

  defp seed_settings!(network, admin) do
    settings =
      ConversionSyncSettings.ensure_cj(%{
        enabled: false,
        interval_minutes: 1_440,
        lookback_days: 90,
        max_pages: 100,
        next_run_at: nil,
        updated_by_user_id: admin.id
      })
      |> Support.expect!("CJ conversion sync settings")

    if settings.affiliate_network_id == network.id do
      settings
    else
      raise "development seed CJ conversion sync settings belong to an unexpected network"
    end
  end

  defp seed_runs!(network, admin, anchor) do
    fixtures = [
      %{
        key: "scheduled-success",
        status: :succeeded,
        trigger: :scheduled,
        requested_by_user_id: nil,
        window_start: days(anchor, -30),
        window_end: hours(anchor, -4),
        cursor: "development:complete",
        pages_fetched: 3,
        records_fetched: 54,
        records_persisted: 53,
        records_failed: 1,
        started_at: hours(anchor, -4),
        finished_at: seconds(hours(anchor, -4), 84),
        error_summary: nil
      },
      %{
        key: "operator-failure",
        status: :failed,
        trigger: :operator,
        requested_by_user_id: admin.id,
        window_start: days(anchor, -7),
        window_end: hours(anchor, -2),
        cursor: "development:page:2",
        pages_fetched: 1,
        records_fetched: 12,
        records_persisted: 10,
        records_failed: 2,
        started_at: hours(anchor, -2),
        finished_at: seconds(hours(anchor, -2), 42),
        error_summary: "Synthetic development failure; no provider request was made."
      },
      %{
        key: "cli-success",
        status: :succeeded,
        trigger: :cli,
        requested_by_user_id: nil,
        window_start: days(anchor, -90),
        window_end: hours(anchor, -30),
        cursor: nil,
        pages_fetched: 2,
        records_fetched: 31,
        records_persisted: 31,
        records_failed: 0,
        started_at: hours(anchor, -30),
        finished_at: seconds(hours(anchor, -30), 75),
        error_summary: nil
      }
    ]

    rows =
      Enum.map(fixtures, fn fixture ->
        entropy_id = Support.stable_uuid("development-cj-conversion-sync-run", fixture.key)
        attrs = fixture |> Map.delete(:key) |> Map.put(:affiliate_network_id, network.id)

        %ConversionSyncRun{}
        |> ConversionSyncRun.changeset(attrs)
        |> Support.validated_row!(@run_fields,
          entropy_id: entropy_id,
          inserted_at: fixture.started_at,
          updated_at: fixture.finished_at,
          stage: "CJ conversion sync run #{fixture.key}"
        )
      end)

    Support.sync_owned_rows!(ConversionSyncRun, rows, @run_fields,
      stage: "CJ conversion sync runs"
    )
  end

  defp seed_correction!(network, reversed_conversion) do
    action_ref = "DEV-CJ-ACTION-REVERSED"
    payload = reversed_conversion.raw_payload

    unless reversed_conversion.affiliate_network_id == network.id and
             reversed_conversion.network_action_ref == action_ref and
             match?(
               %{
                 "commissionId" => "DEV-CJ-CORRECTION-REVERSED",
                 "original" => false,
                 "originalActionId" => ^action_ref
               },
               payload
             ) do
      raise "development reversed conversion does not contain the reserved CJ correction"
    end

    [payload]
    |> Conversions.persist_cj_action_group()
    |> Support.expect!("CJ action correction evidence")

    Repo.get_by!(CJActionCorrection,
      affiliate_network_id: network.id,
      network_action_ref: action_ref
    )
  end

  defp seconds(datetime, count), do: DateTime.add(datetime, count, :second)
  defp hours(datetime, count), do: seconds(datetime, count * 3_600)
  defp days(datetime, count), do: seconds(datetime, count * 86_400)
end
