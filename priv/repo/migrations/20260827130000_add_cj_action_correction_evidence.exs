defmodule ProductCompare.Repo.Migrations.AddCJActionCorrectionEvidence do
  use Ecto.Migration

  def change do
    create table(:commerce_cj_action_corrections) do
      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :delete_all), null: false

      add :network_action_ref, :text, null: false
      add :network_correction_ref, :text, null: false
      add :posting_date, :timestamptz, precision: 6, size: 6, null: false
      add :raw_payload, :map, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(
             :commerce_cj_action_corrections,
             [:affiliate_network_id, :network_action_ref],
             name: :commerce_cj_action_corrections_network_action_uq
           )

    create constraint(
             :commerce_cj_action_corrections,
             :commerce_cj_action_corrections_action_ref_nonblank,
             check: "btrim(network_action_ref) <> ''"
           )

    create constraint(
             :commerce_cj_action_corrections,
             :commerce_cj_action_corrections_correction_ref_nonblank,
             check: "btrim(network_correction_ref) <> ''"
           )

    create constraint(
             :commerce_cj_action_corrections,
             :commerce_cj_action_corrections_payload_is_correction,
             check: "COALESCE(raw_payload->'original' = 'false'::jsonb, false)"
           )
  end
end
