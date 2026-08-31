defmodule ProductCompare.Repo.Migrations.BackfillCJConversionActionRefsTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260830140000_backfill_cj_conversion_action_refs.exs"
                  )
  @migration_version 20_260_830_140_000
  @migration_module ProductCompare.Repo.Migrations.BackfillCJConversionActionRefs

  if File.exists?(@migration_path) and not Code.ensure_loaded?(@migration_module),
    do: Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "upgrade backfills only usable CJ action references without overwriting existing values" do
    assert Code.ensure_loaded?(@migration_module),
           "expected the CJ action-reference backfill to ship in a forward migration"

    with_legacy_schema(fn prefix ->
      assert :ok =
               Ecto.Migrator.up(MigrationRepo, @migration_version, @migration_module,
                 prefix: prefix,
                 log: false
               )

      assert action_refs(prefix) == [
               [1, "camel-action"],
               [2, "pascal-action"],
               [3, "snake-action"],
               [4, nil],
               [5, nil],
               [6, "preserved-action"],
               [7, nil]
             ]
    end)
  end

  defp with_legacy_schema(fun) do
    prefix = "cj_action_backfill_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}".affiliate_networks (
        id bigint PRIMARY KEY,
        code text NOT NULL
      )
      """)

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}".commerce_conversions (
        id bigint PRIMARY KEY,
        affiliate_network_id bigint NOT NULL,
        network_action_ref text,
        raw_payload jsonb NOT NULL
      )
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}".affiliate_networks (id, code)
      VALUES (1, 'cj'), (2, 'impact')
      """)

      MigrationRepo.query!("""
      INSERT INTO "#{prefix}".commerce_conversions
        (id, affiliate_network_id, network_action_ref, raw_payload)
      VALUES
        (1, 1, NULL, jsonb_build_object('originalActionId', ' camel-action ')),
        (2, 1, NULL, jsonb_build_object('OriginalActionId', 'pascal-action')),
        (3, 1, NULL, jsonb_build_object('original_action_id', 'snake-action')),
        (4, 1, NULL, jsonb_build_object('originalActionId', '   ')),
        (5, 1, NULL, jsonb_build_object('originalActionId', 123)),
        (6, 1, 'preserved-action', jsonb_build_object('originalActionId', 'replacement')),
        (7, 2, NULL, jsonb_build_object('originalActionId', 'other-network-action'))
      """)

      fun.(prefix)
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end

  defp action_refs(prefix) do
    %Postgrex.Result{rows: rows} =
      MigrationRepo.query!("""
      SELECT id, network_action_ref
      FROM "#{prefix}".commerce_conversions
      ORDER BY id
      """)

    rows
  end
end
