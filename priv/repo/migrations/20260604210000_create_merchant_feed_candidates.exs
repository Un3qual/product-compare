defmodule ProductCompare.Repo.Migrations.CreateMerchantFeedCandidates do
  use Ecto.Migration

  def change do
    create table(:merchant_feed_candidates) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false
      add :provider, :text, null: false
      add :provider_feed_id, :text, null: false
      add :advertiser_id, :text
      add :advertiser_name, :text
      add :advertiser_country, :text
      add :source_feed_type, :text
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict)
      add :language, :text
      add :feed_name, :text
      add :product_count, :integer
      add :provider_last_updated_at, :utc_datetime_usec
      add :raw_metadata, :map, null: false, default: %{}
      add :last_seen_at, :utc_datetime_usec, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:merchant_feed_candidates, [:source_id, :provider_feed_id],
             name: :merchant_feed_candidates_source_feed_uq
           )

    create index(:merchant_feed_candidates, [:source_id],
             name: :merchant_feed_candidates_source_idx
           )

    create index(:merchant_feed_candidates, [:source_id, :advertiser_id],
             name: :merchant_feed_candidates_source_advertiser_idx
           )

    create unique_index(:merchant_feed_candidates, [:entropy_id])

    create constraint(
             :merchant_feed_candidates,
             :merchant_feed_candidates_product_count_non_negative,
             check: "product_count IS NULL OR product_count >= 0"
           )
  end
end
