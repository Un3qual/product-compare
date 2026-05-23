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
      add :last_seen_at, :utc_datetime_usec, null: false

      timestamps(type: :utc_datetime_usec)
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
