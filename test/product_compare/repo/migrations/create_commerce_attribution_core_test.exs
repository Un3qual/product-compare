defmodule ProductCompare.Repo.Migrations.CreateCommerceAttributionCoreTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  defmodule BootstrapMigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260521160000_create_commerce_attribution_core.exs"
                  )
  @migration_version 20_260_521_160_000

  Code.require_file(@migration_path)

  test "fresh schema gives every click exactly one actor" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert column_exists?(prefix, "commerce_click_sessions", "anonymous_visitor_id")
      refute column_exists?(prefix, "commerce_click_sessions", "anonymous_id")
      assert constraint_exists?(prefix, "commerce_click_sessions_single_actor")

      assert index_definition(prefix, "commerce_click_sessions_anonymous_visitor_idx") =~
               "(anonymous_visitor_id)"

      visitor_id = insert_visitor(prefix)
      click_link_id = insert_click_link(prefix)

      assert {:ok, _result} =
               MigrationRepo.query(
                 """
                 INSERT INTO "#{prefix}"."commerce_click_sessions"
                   (entropy_id, click_id, commerce_link_id, anonymous_visitor_id, inserted_at, updated_at)
                 VALUES ($1, $2, $3, $4, now(), now())
                 """,
                 [uuid(), uuid(), click_link_id, visitor_id]
               )

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "commerce_click_sessions_anonymous_visitor_id_fkey"}
              }} =
               MigrationRepo.query(
                 """
                 INSERT INTO "#{prefix}"."commerce_click_sessions"
                   (entropy_id, click_id, commerce_link_id, anonymous_visitor_id, inserted_at, updated_at)
                 VALUES ($1, $2, $3, $4, now(), now())
                 """,
                 [uuid(), uuid(), click_link_id, -1]
               )

      assert {:error,
              %Postgrex.Error{postgres: %{constraint: "commerce_click_sessions_single_actor"}}} =
               MigrationRepo.query(
                 """
                 INSERT INTO "#{prefix}"."commerce_click_sessions"
                   (entropy_id, click_id, commerce_link_id, user_id, anonymous_visitor_id, inserted_at, updated_at)
                 VALUES ($1, $2, $3, 1, $4, now(), now())
                 """,
                 [uuid(), uuid(), click_link_id, visitor_id]
               )
    end)
  end

  defp with_base_schema(fun) do
    prefix = "commerce_attribution_core_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    start_bootstrap_migration_repo()
    BootstrapMigrationRepo.query!(~s[CREATE SCHEMA "#{prefix}"])

    try do
      start_migration_repo(prefix)

      MigrationRepo.query!(
        ~s[CREATE TYPE "#{prefix}".commerce_link_type AS ENUM ('affiliate', 'non_affiliate')]
      )

      MigrationRepo.query!(
        ~s[CREATE TYPE "#{prefix}".commerce_source_surface AS ENUM ('web', 'api', 'extension')]
      )

      MigrationRepo.query!(
        ~s[CREATE TYPE "#{prefix}".commerce_conversion_status AS ENUM ('pending', 'approved', 'reversed', 'paid')]
      )

      MigrationRepo.query!(
        ~s[CREATE TYPE "#{prefix}".commerce_attribution_confidence AS ENUM ('high', 'low', 'unmatched')]
      )

      for table <- [
            "users",
            "merchants",
            "affiliate_programs",
            "affiliate_networks",
            "products",
            "merchant_products",
            "price_points"
          ] do
        MigrationRepo.query!(~s[CREATE TABLE "#{prefix}"."#{table}" (id bigserial PRIMARY KEY)])
      end

      MigrationRepo.query!(~s[CREATE TABLE "#{prefix}"."currencies" (id integer PRIMARY KEY)])
      MigrationRepo.query!(~s[INSERT INTO "#{prefix}"."users" (id) VALUES (1)])
      MigrationRepo.query!(~s[INSERT INTO "#{prefix}"."merchants" (id) VALUES (1)])

      fun.(prefix)
    after
      BootstrapMigrationRepo.query!(~s[DROP SCHEMA IF EXISTS "#{prefix}" CASCADE])
    end
  end

  defp start_bootstrap_migration_repo do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 1)

    start_supervised!({BootstrapMigrationRepo, config})
  end

  defp start_migration_repo(prefix) do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)
      |> Keyword.put(:parameters, search_path: ~s["#{prefix}", public])

    start_supervised!({MigrationRepo, config})
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.CreateCommerceAttributionCore,
      prefix: prefix,
      log: false
    )
  end

  defp insert_visitor(prefix) do
    [[visitor_id]] =
      MigrationRepo.query!(
        """
        INSERT INTO "#{prefix}"."anonymous_visitors" (entropy_id, inserted_at, updated_at)
        VALUES ($1, now(), now())
        RETURNING id
        """,
        [uuid()]
      ).rows

    visitor_id
  end

  defp insert_click_link(prefix) do
    [[link_id]] =
      MigrationRepo.query!(
        """
        INSERT INTO "#{prefix}"."commerce_links"
          (entropy_id, merchant_id, destination_url, link_type, inserted_at, updated_at)
        VALUES ($1, 1, 'https://example.test/click', 'non_affiliate', now(), now())
        RETURNING id
        """,
        [uuid()]
      ).rows

    link_id
  end

  defp uuid, do: Ecto.UUID.dump!(Ecto.UUID.generate())

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

  defp constraint_exists?(prefix, constraint) do
    MigrationRepo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint AS constraint_record
        JOIN pg_namespace AS namespace ON namespace.oid = constraint_record.connamespace
        WHERE namespace.nspname = $1 AND constraint_record.conname = $2
      )
      """,
      [prefix, constraint]
    ).rows == [[true]]
  end

  defp index_definition(prefix, index) do
    [[definition]] =
      MigrationRepo.query!(
        """
        SELECT pg_get_indexdef(index_relation.oid)
        FROM pg_class AS index_relation
        JOIN pg_namespace AS namespace ON namespace.oid = index_relation.relnamespace
        WHERE namespace.nspname = $1 AND index_relation.relname = $2
        """,
        [prefix, index]
      ).rows

    definition
  end
end
