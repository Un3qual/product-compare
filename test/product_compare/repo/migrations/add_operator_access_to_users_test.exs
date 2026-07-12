defmodule ProductCompare.Repo.Migrations.AddOperatorAccessToUsersTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Path.expand(
                    "../../../../priv/repo/migrations/20260712193000_add_operator_access_to_users.exs",
                    __DIR__
                  )
  @migration_version 20_260_712_193_000

  Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "upgrade preserves only legacy seed users identified by email and reputation evidence" do
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

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."users" (id, email) VALUES
        (1, 'admin@example.com'),
        (2, 'moderator@example.com'),
        (3, 'ordinary@example.com'),
        (4, 'admin@example.com'),
        (5, 'moderator@example.com')
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."user_reputation" (user_id, points) VALUES
        (1, 1000),
        (2, 500),
        (3, 1000),
        (4, 999)
      """)

      assert :ok =
               Ecto.Migrator.up(
                 MigrationRepo,
                 @migration_version,
                 ProductCompare.Repo.Migrations.AddOperatorAccessToUsers,
                 prefix: prefix,
                 log: false
               )

      assert %{rows: [[1, true], [2, true], [3, false], [4, false], [5, false]]} =
               MigrationRepo.query!("""
               SELECT id, is_operator
               FROM "#{prefix}"."users"
               ORDER BY id
               """)

      assert :ok =
               Ecto.Migrator.down(
                 MigrationRepo,
                 @migration_version,
                 ProductCompare.Repo.Migrations.AddOperatorAccessToUsers,
                 prefix: prefix,
                 log: false
               )

      assert %{rows: [[0]]} =
               MigrationRepo.query!(
                 """
                 SELECT count(*)
                 FROM information_schema.columns
                 WHERE table_schema = $1
                   AND table_name = 'users'
                   AND column_name = 'is_operator'
                 """,
                 [prefix]
               )
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end
end
