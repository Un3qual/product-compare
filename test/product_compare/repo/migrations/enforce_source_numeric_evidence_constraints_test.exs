defmodule ProductCompare.Repo.Migrations.EnforceSourceNumericEvidenceConstraintsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260805180000_enforce_source_numeric_evidence_constraints.exs"
                  )
  @migration_version 20_260_805_180_000
  @migration_module ProductCompare.Repo.Migrations.EnforceSourceNumericEvidenceConstraints

  if File.exists?(@migration_path), do: Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "upgrade constrains source amounts on an already-migrated schema and down removes the checks" do
    assert Code.ensure_loaded?(@migration_module),
           "expected source numeric constraints to ship in a forward migration"

    with_legacy_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert {:ok, _result} =
               MigrationRepo.query(~s|INSERT INTO "#{prefix}".price_points VALUES (0, NULL)|)

      assert {:ok, _result} =
               MigrationRepo.query(~s|INSERT INTO "#{prefix}".price_watch_rules VALUES (0)|)

      assert_check_violation(
        prefix,
        "INSERT INTO price_points VALUES ('NaN', 0)",
        "price_points_price_finite_non_negative"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO price_points VALUES (0, 'Infinity')",
        "price_points_shipping_finite_non_negative"
      )

      assert_check_violation(
        prefix,
        "INSERT INTO price_watch_rules VALUES ('Infinity')",
        "price_watch_rules_target_amount_finite_non_negative"
      )

      assert :ok = migrate_down(prefix)

      assert {:ok, _result} =
               MigrationRepo.query(
                 ~s|INSERT INTO "#{prefix}".price_points VALUES ('NaN', 'Infinity')|
               )

      assert {:ok, _result} =
               MigrationRepo.query(
                 ~s|INSERT INTO "#{prefix}".price_watch_rules VALUES ('Infinity')|
               )
    end)
  end

  defp with_legacy_schema(fun) do
    prefix = "source_numeric_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}".price_points (
        price numeric NOT NULL,
        shipping numeric
      )
      """)

      MigrationRepo.query!(~s|CREATE TABLE "#{prefix}".price_watch_rules (target_amount numeric)|)

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
