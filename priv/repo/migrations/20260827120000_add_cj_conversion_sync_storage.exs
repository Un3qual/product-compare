defmodule ProductCompare.Repo.Migrations.AddCJConversionSyncStorage do
  use Ecto.Migration

  def change do
    alter table(:commerce_conversions) do
      add :network_action_ref, :text
    end

    create index(:commerce_conversions, [:affiliate_network_id, :network_action_ref],
             name: :commerce_conversions_network_action_idx,
             where: "network_action_ref IS NOT NULL"
           )

    create table(:commerce_conversion_sync_settings) do
      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :delete_all), null: false

      add :enabled, :boolean, null: false, default: false
      add :interval_minutes, :integer, null: false, default: 1_440
      add :lookback_days, :integer, null: false, default: 90
      add :max_pages, :integer, null: false, default: 100
      add :next_run_at, :timestamptz, precision: 6, size: 6
      add :updated_by_user_id, references(:users, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:commerce_conversion_sync_settings, [:affiliate_network_id],
             name: :commerce_conversion_sync_settings_network_uq
           )

    create constraint(
             :commerce_conversion_sync_settings,
             :commerce_conversion_sync_settings_interval_bounds,
             check: "interval_minutes BETWEEN 15 AND 10080"
           )

    create constraint(
             :commerce_conversion_sync_settings,
             :commerce_conversion_sync_settings_lookback_bounds,
             check: "lookback_days BETWEEN 1 AND 90"
           )

    create constraint(
             :commerce_conversion_sync_settings,
             :commerce_conversion_sync_settings_max_pages_bounds,
             check: "max_pages BETWEEN 1 AND 100"
           )

    create constraint(
             :commerce_conversion_sync_settings,
             :commerce_conversion_sync_settings_enabled_next_run,
             check: "enabled OR next_run_at IS NULL"
           )

    execute(
      "CREATE TYPE commerce_conversion_sync_run_status AS ENUM ('running', 'succeeded', 'failed')",
      "DROP TYPE commerce_conversion_sync_run_status"
    )

    execute(
      "CREATE TYPE commerce_conversion_sync_run_trigger AS ENUM ('scheduled', 'operator', 'cli')",
      "DROP TYPE commerce_conversion_sync_run_trigger"
    )

    create table(:commerce_conversion_sync_runs) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :delete_all), null: false

      add :status, :commerce_conversion_sync_run_status, null: false
      add :trigger, :commerce_conversion_sync_run_trigger, null: false
      add :requested_by_user_id, references(:users, type: :bigint, on_delete: :nilify_all)
      add :window_start, :timestamptz, precision: 6, size: 6, null: false
      add :window_end, :timestamptz, precision: 6, size: 6, null: false
      add :cursor, :text
      add :pages_fetched, :integer, null: false, default: 0
      add :records_fetched, :integer, null: false, default: 0
      add :records_persisted, :integer, null: false, default: 0
      add :records_failed, :integer, null: false, default: 0
      add :started_at, :timestamptz, precision: 6, size: 6, null: false
      add :finished_at, :timestamptz, precision: 6, size: 6
      add :error_summary, :text

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:commerce_conversion_sync_runs, [:entropy_id],
             name: :commerce_conversion_sync_runs_entropy_uq
           )

    create index(:commerce_conversion_sync_runs, [:affiliate_network_id, :started_at, :id],
             name: :commerce_conversion_sync_runs_newest_idx
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_status_valid,
             check: "status IN ('running', 'succeeded', 'failed')"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_trigger_valid,
             check: "trigger IN ('scheduled', 'operator', 'cli')"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_window_increasing,
             check: "window_end > window_start"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_counts_non_negative,
             check:
               "pages_fetched >= 0 AND records_fetched >= 0 AND records_persisted >= 0 AND records_failed >= 0"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_terminal_finished_at_required,
             check: "status = 'running' OR finished_at IS NOT NULL"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_error_summary_length,
             check: "error_summary IS NULL OR char_length(error_summary) <= 500"
           )
  end
end
