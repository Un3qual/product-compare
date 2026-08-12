defmodule ProductCompare.Repo.Migrations.CoverHomepageActivityReadsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260811130000_cover_homepage_activity_reads.exs"
                  )
  @migration_version 20_260_811_130_000
  @retry_migration_version @migration_version + 1
  @old_index "commerce_click_sessions_inserted_at_idx"
  @new_index "commerce_click_sessions_home_activity_idx"

  unless Code.ensure_loaded?(ProductCompare.Repo.Migrations.CoverHomepageActivityReads) do
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

  test "up installs the covering activity index and supersedes the prior time index" do
    with_base_schema(fn prefix ->
      assert access_path_exists?(prefix)
      assert :ok = migrate_up(prefix)

      assert index_valid?(prefix, @new_index)

      assert index_definition(prefix, @new_index) =~
               "(inserted_at, merchant_product_id) INCLUDE (user_id, anonymous_visitor_id)"

      refute index_exists?(prefix, @old_index)
      assert access_path_exists?(prefix)
    end)
  end

  test "down restores the prior time index before removing the covering index" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      assert access_path_exists?(prefix)
      assert :ok = migrate_down(prefix)

      assert index_valid?(prefix, @old_index)
      assert index_definition(prefix, @old_index) =~ "(inserted_at)"
      refute index_exists?(prefix, @new_index)
      assert access_path_exists?(prefix)
    end)
  end

  test "up and down retries preserve valid intended index OIDs" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      new_index_oid = index_oid(prefix, @new_index)

      assert :ok = migrate_up(prefix, @retry_migration_version)
      assert new_index_oid == index_oid(prefix, @new_index)
      refute index_exists?(prefix, @old_index)

      assert :ok = migrate_down(prefix, @retry_migration_version)
      old_index_oid = index_oid(prefix, @old_index)

      assert :ok = migrate_down(prefix)
      assert old_index_oid == index_oid(prefix, @old_index)
      refute index_exists?(prefix, @new_index)
    end)
  end

  test "up repairs an invalid same-named covering index" do
    with_base_schema(fn prefix ->
      insert_duplicate_actors(prefix)

      assert_raise Postgrex.Error, fn ->
        MigrationRepo.query!("""
        CREATE UNIQUE INDEX CONCURRENTLY #{@new_index}
        ON "#{prefix}"."commerce_click_sessions" (user_id)
        """)
      end

      refute index_valid?(prefix, @new_index)
      assert index_valid?(prefix, @old_index)

      assert :ok = migrate_up(prefix)
      assert index_valid?(prefix, @new_index)

      assert index_definition(prefix, @new_index) =~
               "(inserted_at, merchant_product_id) INCLUDE (user_id, anonymous_visitor_id)"

      refute index_exists?(prefix, @old_index)
    end)
  end

  test "up replaces a valid wrong same-named covering index" do
    with_base_schema(fn prefix ->
      MigrationRepo.query!("""
      CREATE INDEX #{@new_index}
      ON "#{prefix}"."commerce_click_sessions" (id)
      """)

      wrong_index_oid = index_oid(prefix, @new_index)

      assert :ok = migrate_up(prefix)
      refute wrong_index_oid == index_oid(prefix, @new_index)

      assert index_definition(prefix, @new_index) =~
               "(inserted_at, merchant_product_id) INCLUDE (user_id, anonymous_visitor_id)"

      refute index_exists?(prefix, @old_index)
    end)
  end

  test "down repairs an invalid same-named prior index" do
    with_base_schema(fn prefix ->
      insert_duplicate_actors(prefix)
      assert :ok = migrate_up(prefix)

      assert_raise Postgrex.Error, fn ->
        MigrationRepo.query!("""
        CREATE UNIQUE INDEX CONCURRENTLY #{@old_index}
        ON "#{prefix}"."commerce_click_sessions" (user_id)
        """)
      end

      refute index_valid?(prefix, @old_index)
      assert index_valid?(prefix, @new_index)

      assert :ok = migrate_down(prefix)
      assert index_valid?(prefix, @old_index)
      assert index_definition(prefix, @old_index) =~ "(inserted_at)"
      refute index_exists?(prefix, @new_index)
    end)
  end

  test "down replaces a valid wrong same-named prior index" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      MigrationRepo.query!("""
      CREATE INDEX #{@old_index}
      ON "#{prefix}"."commerce_click_sessions" (id)
      """)

      wrong_index_oid = index_oid(prefix, @old_index)

      assert :ok = migrate_down(prefix)
      refute wrong_index_oid == index_oid(prefix, @old_index)
      assert index_definition(prefix, @old_index) =~ "(inserted_at)"
      refute index_exists?(prefix, @new_index)
    end)
  end

  test "up and down create replacement access paths before dropping predecessors" do
    with_base_schema(fn prefix ->
      {up_result, up_queries} = capture_queries(fn -> migrate_up(prefix) end)
      assert :ok = up_result

      assert_query_order(
        up_queries,
        "CREATE INDEX CONCURRENTLY \"#{@new_index}\"",
        "DROP INDEX CONCURRENTLY IF EXISTS \"#{prefix}\".\"#{@old_index}\""
      )

      {down_result, down_queries} = capture_queries(fn -> migrate_down(prefix) end)
      assert :ok = down_result

      assert_query_order(
        down_queries,
        "CREATE INDEX CONCURRENTLY \"#{@old_index}\"",
        "DROP INDEX CONCURRENTLY IF EXISTS \"#{prefix}\".\"#{@new_index}\""
      )
    end)
  end

  defp with_base_schema(fun) do
    prefix = "homepage_activity_read_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s[CREATE SCHEMA "#{prefix}"])

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."commerce_click_sessions" (
        id bigserial PRIMARY KEY,
        merchant_product_id bigint,
        user_id bigint,
        anonymous_visitor_id bigint,
        inserted_at timestamptz NOT NULL
      )
      """)

      MigrationRepo.query!("""
      CREATE INDEX #{@old_index}
      ON "#{prefix}"."commerce_click_sessions" (inserted_at)
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
      ProductCompare.Repo.Migrations.CoverHomepageActivityReads,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix, version \\ @migration_version) do
    Ecto.Migrator.down(
      MigrationRepo,
      version,
      ProductCompare.Repo.Migrations.CoverHomepageActivityReads,
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

  defp access_path_exists?(prefix) do
    Enum.any?([@old_index, @new_index], &index_valid?(prefix, &1))
  end

  defp insert_duplicate_actors(prefix) do
    MigrationRepo.query!("""
    INSERT INTO "#{prefix}"."commerce_click_sessions"
      (merchant_product_id, user_id, inserted_at)
    VALUES
      (1, 1, now()),
      (2, 1, now())
    """)
  end

  defp capture_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          send(pid, {message_ref, metadata.query})
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, queries) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | queries])
    after
      0 -> Enum.reverse(queries)
    end
  end

  defp assert_query_order(queries, earlier_fragment, later_fragment) do
    earlier_position = Enum.find_index(queries, &String.contains?(&1, earlier_fragment))
    later_position = Enum.find_index(queries, &String.contains?(&1, later_fragment))

    assert is_integer(earlier_position)
    assert is_integer(later_position)
    assert earlier_position < later_position
  end
end
