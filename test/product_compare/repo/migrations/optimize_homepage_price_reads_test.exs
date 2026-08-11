defmodule ProductCompare.Repo.Migrations.OptimizeHomepagePriceReadsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260811120000_optimize_homepage_price_reads.exs"
                  )
  @migration_version 20_260_811_120_000

  unless Code.ensure_loaded?(ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads) do
    Code.require_file(@migration_path)
  end

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "up installs the deterministic covering latest-price index" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert index_definition(prefix, "price_points_home_latest_idx") =~
               "(merchant_product_id, observed_at DESC, id DESC) INCLUDE (price, shipping, in_stock)"

      refute index_exists?(prefix, "price_points_mp_time_idx")
    end)
  end

  test "down restores the prior latest-price index" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      assert :ok = migrate_down(prefix)

      assert index_definition(prefix, "price_points_mp_time_idx") =~
               "(merchant_product_id, observed_at)"

      refute index_exists?(prefix, "price_points_home_latest_idx")
    end)
  end

  test "down keeps the new access path if restoring the prior index cannot proceed" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      MigrationRepo.query!("""
      CREATE INDEX price_points_mp_time_idx
      ON "#{prefix}"."price_points" (id)
      """)

      assert_raise Postgrex.Error, fn -> migrate_down(prefix) end
      assert index_exists?(prefix, "price_points_home_latest_idx")
    end)
  end

  defp with_base_schema(fun) do
    prefix = "homepage_price_read_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s[CREATE SCHEMA "#{prefix}"])

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."price_points" (
        id bigserial PRIMARY KEY,
        merchant_product_id bigint NOT NULL,
        observed_at timestamptz NOT NULL,
        price numeric NOT NULL,
        shipping numeric,
        in_stock boolean
      )
      """)

      MigrationRepo.query!("""
      CREATE INDEX price_points_mp_time_idx
      ON "#{prefix}"."price_points" (merchant_product_id, observed_at)
      """)

      fun.(prefix)
    after
      MigrationRepo.query!(~s[DROP SCHEMA IF EXISTS "#{prefix}" CASCADE])
    end
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads,
      prefix: prefix,
      log: false
    )
  end

  defp index_exists?(prefix, index) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = $1 AND indexname = $2
      )
      """,
      [prefix, index]
    ).rows == [[true]]
  end

  defp index_definition(prefix, index) do
    case MigrationRepo.query!(
           """
           SELECT indexdef
           FROM pg_indexes
           WHERE schemaname = $1 AND indexname = $2
           """,
           [prefix, index]
         ).rows do
      [[definition]] -> definition
      [] -> nil
    end
  end
end
