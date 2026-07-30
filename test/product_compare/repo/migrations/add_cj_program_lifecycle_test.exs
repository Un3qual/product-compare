defmodule ProductCompare.Repo.Migrations.AddCJProgramLifecycleTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs"
                  )
  @migration_version 20_260_725_120_000

  Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "up creates the final program lifecycle schema without transient review fields" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert column_exists?(prefix, "merchant_feed_candidates", "cj_program_id")
      refute column_exists?(prefix, "merchant_feed_candidates", "review_status")
      refute column_exists?(prefix, "merchant_feed_candidates", "review_note")
      refute column_exists?(prefix, "merchant_feed_candidates", "reviewed_at")

      assert {:ok, %{rows: [[program_id]]}} =
               MigrationRepo.query("""
               INSERT INTO "#{prefix}"."cj_programs"
                 (source_id, advertiser_id, changed_at, inserted_at, updated_at)
               VALUES (1, 'advertiser-1', now(), now(), now())
               RETURNING id
               """)

      assert {:ok, _result} =
               MigrationRepo.query(
                 """
                 UPDATE "#{prefix}"."merchant_feed_candidates"
                 SET cj_program_id = $1
                 WHERE id = 1
                 """,
                 [program_id]
               )

      assert foreign_key_target(prefix, "merchant_feed_candidates", "cj_program_id") ==
               [["cj_programs", "id"]]
    end)
  end

  test "program identity and stage are constrained and down cleanly removes the lifecycle" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."cj_programs"
        (source_id, advertiser_id, changed_at, inserted_at, updated_at)
      VALUES (1, 'advertiser-1', now(), now(), now())
      """)

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "cj_programs_source_advertiser_uq"}
              }} =
               MigrationRepo.query("""
               INSERT INTO "#{prefix}"."cj_programs"
                 (source_id, advertiser_id, changed_at, inserted_at, updated_at)
               VALUES (1, 'advertiser-1', now(), now(), now())
               """)

      assert {:error,
              %Postgrex.Error{
                postgres: %{code: :invalid_text_representation}
              }} =
               MigrationRepo.query("""
               INSERT INTO "#{prefix}"."cj_programs"
                 (source_id, advertiser_id, stage, changed_at, inserted_at, updated_at)
               VALUES (1, 'advertiser-2', 'unknown', now(), now(), now())
               """)

      assert :ok = migrate_down(prefix)
      refute column_exists?(prefix, "merchant_feed_candidates", "cj_program_id")
      refute table_exists?(prefix, "cj_programs")
    end)
  end

  defp with_base_schema(fun) do
    prefix = "cj_program_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."sources" (
        id bigserial PRIMARY KEY
      )
      """)

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."merchant_feed_candidates" (
        id bigserial PRIMARY KEY,
        source_id bigint NOT NULL REFERENCES "#{prefix}"."sources"(id),
        advertiser_id text
      )
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."sources" (id)
      VALUES (1)
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."merchant_feed_candidates" (source_id, advertiser_id)
      VALUES (1, 'advertiser-1')
      """)

      fun.(prefix)
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddCJProgramLifecycle,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddCJProgramLifecycle,
      prefix: prefix,
      log: false
    )
  end

  defp foreign_key_target(prefix, table, column) do
    MigrationRepo.query!(
      """
      SELECT referenced_table.relname, referenced_column.attname
      FROM pg_constraint constraint_record
      JOIN pg_class owner_table
        ON owner_table.oid = constraint_record.conrelid
      JOIN pg_namespace owner_namespace
        ON owner_namespace.oid = owner_table.relnamespace
      JOIN pg_class referenced_table
        ON referenced_table.oid = constraint_record.confrelid
      JOIN LATERAL unnest(constraint_record.conkey, constraint_record.confkey)
        AS key_columns(owner_attnum, referenced_attnum)
        ON true
      JOIN pg_attribute owner_column
        ON owner_column.attrelid = owner_table.oid
       AND owner_column.attnum = key_columns.owner_attnum
      JOIN pg_attribute referenced_column
        ON referenced_column.attrelid = referenced_table.oid
       AND referenced_column.attnum = key_columns.referenced_attnum
      WHERE constraint_record.contype = 'f'
        AND owner_namespace.nspname = $1
        AND owner_table.relname = $2
        AND owner_column.attname = $3
      """,
      [prefix, table, column]
    ).rows
  end

  defp column_exists?(prefix, table, column) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
          AND column_name = $3
      )
      """,
      [prefix, table, column]
    ).rows == [[true]]
  end

  defp table_exists?(prefix, table) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_name = $2
      )
      """,
      [prefix, table]
    ).rows == [[true]]
  end
end
