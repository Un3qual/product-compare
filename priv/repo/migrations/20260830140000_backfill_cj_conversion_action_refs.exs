defmodule ProductCompare.Repo.Migrations.BackfillCJConversionActionRefs do
  use Ecto.Migration

  import Ecto.Query

  @action_ref_keys ["originalActionId", "OriginalActionId", "original_action_id"]

  def up do
    migration_prefix = prefix()

    execute(fn ->
      Enum.each(@action_ref_keys, &backfill_key(migration_prefix, &1))
    end)
  end

  def down, do: :ok

  defp backfill_key(migration_prefix, key) do
    from(conversion in "commerce_conversions",
      prefix: ^migration_prefix,
      join: network in "affiliate_networks",
      prefix: ^migration_prefix,
      on: network.id == conversion.affiliate_network_id,
      where: network.code == "cj",
      where: is_nil(conversion.network_action_ref),
      where: fragment("jsonb_typeof(?->?) = 'string'", conversion.raw_payload, ^key),
      where: fragment("BTRIM(?->>?) <> ''", conversion.raw_payload, ^key),
      update: [
        set: [network_action_ref: fragment("BTRIM(?->>?)", conversion.raw_payload, ^key)]
      ]
    )
    |> repo().update_all([])
  end
end
