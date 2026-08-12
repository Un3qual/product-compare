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
  @retry_migration_version @migration_version + 1

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

  test "up and down converge without rebuilding valid intended indexes" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      new_index_oid = index_oid(prefix, "price_points_home_latest_idx")

      assert :ok = migrate_up(prefix, @retry_migration_version)
      assert new_index_oid == index_oid(prefix, "price_points_home_latest_idx")
      refute index_exists?(prefix, "price_points_mp_time_idx")

      assert :ok = migrate_down(prefix, @retry_migration_version)
      old_index_oid = index_oid(prefix, "price_points_mp_time_idx")

      assert :ok = migrate_down(prefix)
      assert old_index_oid == index_oid(prefix, "price_points_mp_time_idx")
      refute index_exists?(prefix, "price_points_home_latest_idx")
    end)
  end

  test "up repairs an invalid same-named concurrent latest-price index" do
    with_base_schema(fn prefix ->
      insert_duplicate_prices(prefix)

      assert_raise Postgrex.Error, fn ->
        MigrationRepo.query!("""
        CREATE UNIQUE INDEX CONCURRENTLY price_points_home_latest_idx
        ON "#{prefix}"."price_points" (price)
        """)
      end

      refute index_valid?(prefix, "price_points_home_latest_idx")

      assert :ok = migrate_up(prefix)
      assert index_valid?(prefix, "price_points_home_latest_idx")

      assert index_definition(prefix, "price_points_home_latest_idx") =~
               "(merchant_product_id, observed_at DESC, id DESC) INCLUDE (price, shipping, in_stock)"
    end)
  end

  test "down repairs an invalid same-named prior index before removing the new path" do
    with_base_schema(fn prefix ->
      insert_duplicate_prices(prefix)
      assert :ok = migrate_up(prefix)

      assert_raise Postgrex.Error, fn ->
        MigrationRepo.query!("""
        CREATE UNIQUE INDEX CONCURRENTLY price_points_mp_time_idx
        ON "#{prefix}"."price_points" (price)
        """)
      end

      refute index_valid?(prefix, "price_points_mp_time_idx")

      assert :ok = migrate_down(prefix)
      assert index_valid?(prefix, "price_points_mp_time_idx")

      assert index_definition(prefix, "price_points_mp_time_idx") =~
               "(merchant_product_id, observed_at)"

      refute index_exists?(prefix, "price_points_home_latest_idx")
    end)
  end

  test "down replaces a valid wrong same-named index before removing the new path" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      MigrationRepo.query!("""
      CREATE INDEX price_points_mp_time_idx
      ON "#{prefix}"."price_points" (id)
      """)

      wrong_index_oid = index_oid(prefix, "price_points_mp_time_idx")

      assert :ok = migrate_down(prefix)
      refute wrong_index_oid == index_oid(prefix, "price_points_mp_time_idx")

      assert index_definition(prefix, "price_points_mp_time_idx") =~
               "(merchant_product_id, observed_at)"

      refute index_exists?(prefix, "price_points_home_latest_idx")
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

  defp migrate_up(prefix, version \\ @migration_version) do
    Ecto.Migrator.up(
      MigrationRepo,
      version,
      ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix, version \\ @migration_version) do
    Ecto.Migrator.down(
      MigrationRepo,
      version,
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

  defp index_valid?(prefix, index) do
    MigrationRepo.query!(
      """
      SELECT index_record.indisvalid
      FROM pg_index AS index_record
      JOIN pg_class AS index_relation ON index_relation.oid = index_record.indexrelid
      JOIN pg_namespace AS namespace ON namespace.oid = index_relation.relnamespace
      WHERE namespace.nspname = $1 AND index_relation.relname = $2
      """,
      [prefix, index]
    ).rows == [[true]]
  end

  defp index_oid(prefix, index) do
    [[oid]] =
      MigrationRepo.query!(
        """
        SELECT index_relation.oid
        FROM pg_class AS index_relation
        JOIN pg_namespace AS namespace ON namespace.oid = index_relation.relnamespace
        WHERE namespace.nspname = $1 AND index_relation.relname = $2
        """,
        [prefix, index]
      ).rows

    oid
  end

  defp insert_duplicate_prices(prefix) do
    MigrationRepo.query!("""
    INSERT INTO "#{prefix}"."price_points"
      (merchant_product_id, observed_at, price, shipping, in_stock)
    VALUES
      (1, now(), 10, 1, true),
      (2, now(), 10, 1, true)
    """)
  end
end
