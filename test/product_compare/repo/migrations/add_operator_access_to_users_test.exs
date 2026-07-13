defmodule ProductCompare.Repo.Migrations.AddOperatorAccessToUsersTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260712193000_add_operator_access_to_users.exs"
                  )
  @migration_version 20_260_712_193_000
  @operator_ids_env "PRODUCT_COMPARE_OPERATOR_USER_IDS"

  Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})

    original_env = System.get_env(@operator_ids_env)
    System.delete_env(@operator_ids_env)

    on_exit(fn -> restore_env(@operator_ids_env, original_env) end)
    :ok
  end

  test "upgrade fails closed and rolls back when vulnerable legacy staff rows have no decision" do
    with_legacy_schema(fn prefix ->
      assert_raise RuntimeError, ~r/#{@operator_ids_env}.*required/s, fn ->
        migrate_up(prefix)
      end

      refute column_exists?(prefix, "is_operator")
    end)
  end

  test "upgrade accepts an explicit none decision and leaves every user non-operator" do
    System.put_env(@operator_ids_env, "none")

    with_legacy_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      assert operator_rows(prefix) == [[1, false], [2, false], [3, false]]

      assert :ok = migrate_down(prefix)
      refute column_exists?(prefix, "is_operator")
    end)
  end

  test "upgrade promotes exactly the explicitly selected existing IDs" do
    System.put_env(@operator_ids_env, "1,2")

    with_legacy_schema(fn prefix ->
      assert :ok = migrate_up(prefix)
      assert operator_rows(prefix) == [[1, true], [2, true], [3, false]]
    end)
  end

  test "upgrade rejects malformed, duplicate, non-positive, and nonexistent IDs" do
    for invalid_value <- [
          "",
          " 1",
          "1, 2",
          "1,1",
          "0",
          "-1",
          "abc",
          "9223372036854775808",
          "1,999"
        ] do
      System.put_env(@operator_ids_env, invalid_value)

      with_legacy_schema(fn prefix ->
        assert_raise RuntimeError, ~r/#{@operator_ids_env}/, fn ->
          migrate_up(prefix)
        end

        refute column_exists?(prefix, "is_operator")
      end)
    end
  end

  test "upgrade needs no decision when no legacy staff-email rows exist" do
    with_legacy_schema([ordinary_only: true], fn prefix ->
      assert :ok = migrate_up(prefix)
      assert operator_rows(prefix) == [[3, false]]
    end)
  end

  defp with_legacy_schema(options \\ [], fun) do
    prefix = "operator_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."users" (
        id bigserial PRIMARY KEY,
        email varchar(255) NOT NULL
      )
      """)

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."user_reputation" (
        id bigserial PRIMARY KEY,
        user_id bigint NOT NULL,
        points integer NOT NULL
      )
      """)

      if options[:ordinary_only] do
        MigrationRepo.query!("""
        INSERT INTO "#{prefix}"."users" (id, email) VALUES
          (3, 'ordinary@example.com')
        """)
      else
        MigrationRepo.query!("""
        INSERT INTO "#{prefix}"."users" (id, email) VALUES
          (1, 'admin@example.com'),
          (2, 'moderator@example.com'),
          (3, 'ordinary@example.com')
        """)

        # This is the exact vulnerable legacy state: preclaimed staff-email
        # accounts received these reputation values from the old seed flow.
        MigrationRepo.query!("""
        INSERT INTO "#{prefix}"."user_reputation" (user_id, points) VALUES
          (1, 1000),
          (2, 500),
          (3, 1000)
        """)
      end

      fun.(prefix)
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddOperatorAccessToUsers,
      prefix: prefix,
      log: false
    )
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddOperatorAccessToUsers,
      prefix: prefix,
      log: false
    )
  end

  defp operator_rows(prefix) do
    %{rows: rows} =
      MigrationRepo.query!("""
      SELECT id, is_operator
      FROM "#{prefix}"."users"
      ORDER BY id
      """)

    rows
  end

  defp column_exists?(prefix, column) do
    %{rows: [[count]]} =
      MigrationRepo.query!(
        """
        SELECT count(*)
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = 'users'
          AND column_name = $2
        """,
        [prefix, column]
      )

    count == 1
  end

  defp restore_env(name, nil), do: System.delete_env(name)
  defp restore_env(name, value), do: System.put_env(name, value)
end
