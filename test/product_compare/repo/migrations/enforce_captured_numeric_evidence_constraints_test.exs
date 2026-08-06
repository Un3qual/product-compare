defmodule ProductCompare.Repo.Migrations.EnforceCapturedNumericEvidenceConstraintsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260805170000_enforce_captured_numeric_evidence_constraints.exs"
                  )
  @migration_version 20_260_805_170_000
  @migration_module ProductCompare.Repo.Migrations.EnforceCapturedNumericEvidenceConstraints

  if File.exists?(@migration_path), do: Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "upgrade adds finite numeric checks to an already-migrated schema and down removes them" do
    assert Code.ensure_loaded?(@migration_module),
           "expected the captured numeric evidence constraints to ship in a forward migration"

    with_legacy_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert_check_violation(
        prefix,
        "INSERT INTO comparison_snapshot_offers VALUES ('NaN', 0, 0)",
        "comparison_snapshot_offers_amounts_non_negative"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO comparison_snapshot_rankings VALUES ('Infinity')",
        "comparison_snapshot_rankings_landed_price_non_negative"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO price_watch_rules VALUES ('NaN')",
        "price_watch_rules_baseline_landed_price_non_negative"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO alert_events VALUES (0, 0, 'Infinity', NULL, NULL, NULL)",
        "alert_events_numeric_evidence_bounds"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO comparison_snapshot_attributes VALUES (1.01)",
        "comparison_snapshot_attributes_confidence_range"
      )

      assert {:ok, _result} =
               MigrationRepo.query(
                 ~s|INSERT INTO "#{prefix}".comparison_snapshot_offers VALUES (0, 0, 0)|
               )

      assert :ok = migrate_down(prefix)

      assert {:ok, _result} =
               MigrationRepo.query(
                 ~s|INSERT INTO "#{prefix}".comparison_snapshot_offers VALUES ('NaN', 0, 0)|
               )
    end)
  end

  defp with_legacy_schema(fun) do
    prefix = "captured_numeric_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!(
        ~s|CREATE TABLE "#{prefix}".comparison_snapshot_attributes (confidence numeric)|
      )

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}".comparison_snapshot_offers (
        item_price numeric NOT NULL,
        shipping numeric NOT NULL,
        landed_price numeric NOT NULL
      )
      """)

      MigrationRepo.query!(
        ~s|CREATE TABLE "#{prefix}".comparison_snapshot_rankings (landed_price numeric NOT NULL)|
      )

      MigrationRepo.query!(
        ~s|CREATE TABLE "#{prefix}".price_watch_rules (baseline_landed_price numeric)|
      )

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}".alert_events (
        item_price numeric NOT NULL,
        shipping numeric NOT NULL,
        landed_price numeric NOT NULL,
        baseline_landed_price numeric,
        target_amount numeric,
        percentage_drop numeric
      )
      """)

      fun.(prefix)
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(MigrationRepo, @migration_version, @migration_module,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(MigrationRepo, @migration_version, @migration_module,
      prefix: prefix,
      log: false
    )
  end

  defp assert_check_violation(prefix, insert_sql, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             MigrationRepo.query(
               String.replace(insert_sql, "INSERT INTO ", ~s|INSERT INTO "#{prefix}".|)
             )
  end
end
