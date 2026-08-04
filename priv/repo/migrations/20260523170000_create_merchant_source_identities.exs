defmodule ProductCompare.Repo.Migrations.CreateMerchantSourceIdentities do
  use Ecto.Migration

  def change do
    create table(:merchant_source_identities) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false
      add :merchant_id, references(:merchants, type: :bigint, on_delete: :delete_all), null: false
      add :merchant_identifier, :text, null: false
      add :merchant_name, :text
      add :merchant_domain, :text
      add :last_seen_at, :timestamptz, precision: 6, size: 6, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:merchant_source_identities, [:source_id, :merchant_identifier],
             name: :merchant_source_identities_source_identifier_uq
           )

    create index(:merchant_source_identities, [:source_id],
             name: :merchant_source_identities_source_idx
           )

    create index(:merchant_source_identities, [:merchant_id],
             name: :merchant_source_identities_merchant_idx
           )

    create unique_index(:merchant_source_identities, [:entropy_id])
  end
end
