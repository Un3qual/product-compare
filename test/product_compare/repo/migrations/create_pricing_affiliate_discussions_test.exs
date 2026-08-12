defmodule ProductCompare.Repo.Migrations.CreatePricingAffiliateDiscussionsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule BootstrapMigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260303222611_create_pricing_affiliate_discussions.exs"
                  )
  @migration_version 20_260_303_222_611

  unless Code.ensure_loaded?(ProductCompare.Repo.Migrations.CreatePricingAffiliateDiscussions) do
    Code.require_file(@migration_path)
  end

  test "fresh pricing migration creates the active New-deal merchant-product index" do
    with_base_schema(fn prefix ->
      assert :ok = migrate_up(prefix)

      assert definition = index_definition(prefix, "merchant_products_home_new_idx")

      assert definition =~ "(currency_id, inserted_at, id) WHERE (is_active = true)"
    end)
  end

  defp with_base_schema(fun) do
    prefix = "pricing_affiliate_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    start_bootstrap_migration_repo()
    BootstrapMigrationRepo.query!(~s[CREATE SCHEMA "#{prefix}"])

    try do
      start_migration_repo(prefix)

      for {table, id_type} <- [
            {"affiliate_program_statuses", "integer"},
            {"currencies", "integer"},
            {"products", "bigint"},
            {"source_artifacts", "bigint"},
            {"users", "bigint"}
          ] do
        MigrationRepo.query!(~s[CREATE TABLE "#{prefix}"."#{table}" (id #{id_type} PRIMARY KEY)])
      end

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
      ProductCompare.Repo.Migrations.CreatePricingAffiliateDiscussions,
      prefix: prefix,
      log: false
    )
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
