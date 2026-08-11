defmodule ProductCompare.Repo.Migrations.CreateAnonymousVisitorsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260810140000_create_anonymous_visitors.exs"
                  )
  @migration_version 20_260_810_140_000

  Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "up preserves guest equality groups and enforces typed actor identity" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert column_exists?(prefix, "commerce_click_sessions", "anonymous_id")
      assert constraint_validated?(prefix, "commerce_click_sessions_anonymous_visitor_id_fkey")
      assert constraint_validated?(prefix, "commerce_click_sessions_single_actor")
      assert index_exists?(prefix, "commerce_click_sessions_anonymous_visitor_idx")

      assert [["legacy-one"], ["legacy-one"]] =
               MigrationRepo.query!("""
               SELECT anonymous_id
               FROM "#{prefix}"."commerce_click_sessions"
               WHERE click_id IN ('first', 'repeat')
               ORDER BY click_id
               """).rows

      rows =
        MigrationRepo.query!(
          ~s(SELECT click_id, user_id, anonymous_visitor_id FROM "#{prefix}"."commerce_click_sessions" ORDER BY click_id)
        ).rows

      assert [
               ["authenticated", 1, nil],
               ["blank", nil, nil],
               ["first", nil, first_id],
               ["none", nil, nil],
               ["repeat", nil, first_id],
               ["second", nil, second_id]
             ] = rows

      refute first_id == second_id

      assert {:ok, _result} =
               MigrationRepo.query(
                 ~s[INSERT INTO "#{prefix}"."commerce_click_sessions" (click_id, anonymous_id) VALUES ('late', 'late-legacy')]
               )

      assert [[late_visitor_id]] =
               MigrationRepo.query!("""
               SELECT anonymous_visitor_id
               FROM "#{prefix}"."commerce_click_sessions"
               WHERE click_id = 'late'
               """).rows

      assert is_integer(late_visitor_id)

      assert {:error,
              %Postgrex.Error{postgres: %{constraint: "commerce_click_sessions_single_actor"}}} =
               MigrationRepo.query(
                 ~s(UPDATE "#{prefix}"."commerce_click_sessions" SET user_id = 1 WHERE click_id = 'first')
               )

      assert {:ok, _} =
               MigrationRepo.query(
                 ~s(DELETE FROM "#{prefix}"."anonymous_visitors" WHERE id = $1),
                 [first_id]
               )

      assert [[nil], [nil]] =
               MigrationRepo.query!("""
               SELECT anonymous_visitor_id
               FROM "#{prefix}"."commerce_click_sessions"
               WHERE click_id IN ('first', 'repeat')
               ORDER BY click_id
               """).rows
    end)
  end

  test "down preserves every legacy anonymous id byte-for-byte" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      assert :ok = migrate_down(prefix)

      assert [
               ["authenticated", 1, "legacy-user-value"],
               ["blank", nil, "  "],
               ["first", nil, "legacy-one"],
               ["none", nil, nil],
               ["repeat", nil, "legacy-one"],
               ["second", nil, "legacy-two"]
             ] =
               MigrationRepo.query!(
                 ~s(SELECT click_id, user_id, anonymous_id FROM "#{prefix}"."commerce_click_sessions" ORDER BY click_id)
               ).rows

      refute table_exists?(prefix, "anonymous_visitors")
    end)
  end

  test "single-actor constraint rejects direct dual-actor inserts" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      [[visitor_id]] =
        MigrationRepo.query!(~s[SELECT id FROM "#{prefix}"."anonymous_visitors" LIMIT 1]).rows

      assert {:error,
              %Postgrex.Error{postgres: %{constraint: "commerce_click_sessions_single_actor"}}} =
               MigrationRepo.query(
                 """
                 INSERT INTO "#{prefix}"."commerce_click_sessions"
                   (click_id, user_id, anonymous_id, anonymous_visitor_id)
                 VALUES ('dual-actor-insert', 1, 'legacy-user-value', $1)
                 """,
                 [visitor_id]
               )
    end)
  end

  test "single-actor constraint rejects dual-column updates to authenticated legacy rows" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      [[visitor_id]] =
        MigrationRepo.query!(~s[SELECT id FROM "#{prefix}"."anonymous_visitors" LIMIT 1]).rows

      assert {:error,
              %Postgrex.Error{postgres: %{constraint: "commerce_click_sessions_single_actor"}}} =
               MigrationRepo.query(
                 """
                 UPDATE "#{prefix}"."commerce_click_sessions"
                 SET anonymous_id = 'changed-legacy-user-value', anonymous_visitor_id = $1
                 WHERE click_id = 'authenticated'
                 """,
                 [visitor_id]
               )
    end)
  end

  defp with_base_schema(fun) do
    prefix = "anonymous_visitor_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s[CREATE SCHEMA "#{prefix}"])

    try do
      MigrationRepo.query!(~s[CREATE TABLE "#{prefix}"."users" (id bigserial PRIMARY KEY)])
      MigrationRepo.query!(~s[INSERT INTO "#{prefix}"."users" (id) VALUES (1)])

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."commerce_click_sessions" (
        id bigserial PRIMARY KEY,
        click_id text NOT NULL,
        user_id bigint REFERENCES "#{prefix}"."users"(id) ON DELETE SET NULL,
        anonymous_id text
      )
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."commerce_click_sessions" (click_id, user_id, anonymous_id)
      VALUES
        ('authenticated', 1, 'legacy-user-value'),
        ('blank', NULL, '  '),
        ('first', NULL, 'legacy-one'),
        ('none', NULL, NULL),
        ('repeat', NULL, 'legacy-one'),
        ('second', NULL, 'legacy-two')
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
      ProductCompare.Repo.Migrations.CreateAnonymousVisitors,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.CreateAnonymousVisitors,
      prefix: prefix,
      log: false
    )
  end

  defp table_exists?(prefix, table) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      )
      """,
      [prefix, table]
    ).rows == [[true]]
  end

  defp column_exists?(prefix, table, column) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
      )
      """,
      [prefix, table, column]
    ).rows == [[true]]
  end

  defp constraint_validated?(prefix, constraint) do
    MigrationRepo.query!(
      """
      SELECT constraint_record.convalidated
      FROM pg_constraint AS constraint_record
      JOIN pg_namespace AS namespace ON namespace.oid = constraint_record.connamespace
      WHERE namespace.nspname = $1 AND constraint_record.conname = $2
      """,
      [prefix, constraint]
    ).rows == [[true]]
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
end
