defmodule ProductCompare.Repo.Migrations.AddCommunityWriteControls do
  use Ecto.Migration

  def up do
    create table(:community_write_receipts) do
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :idempotency_key, :string, size: 128, null: false
      add :payload_digest, :binary, null: false
      add :content_type, :community_content_type, null: false
      add :content_entropy_id, :uuid, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6, updated_at: false)
    end

    create unique_index(
             :community_write_receipts,
             [:user_id, :content_type, :idempotency_key],
             name: :community_write_receipts_user_content_key_uq
           )

    create index(:community_write_receipts, [:content_type, :content_entropy_id])

    create constraint(:community_write_receipts, :community_write_receipts_key_check,
             check:
               "char_length(idempotency_key) BETWEEN 16 AND 128 AND idempotency_key ~ '^[ -~]+$'"
           )

    create constraint(:community_write_receipts, :community_write_receipts_digest_check,
             check: "octet_length(payload_digest) = 32"
           )

    create table(:community_write_windows) do
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :action_kind, :community_action_kind, null: false
      add :window_started_at, :timestamptz, precision: 6, size: 6, null: false
      add :count, :integer, null: false, default: 0

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(
             :community_write_windows,
             [:user_id, :action_kind, :window_started_at],
             name: :community_write_windows_user_action_window_uq
           )

    create constraint(:community_write_windows, :community_write_windows_count_check,
             check: "count >= 0"
           )

    create constraint(:community_write_windows, :community_write_windows_hour_check,
             check: "date_trunc('hour', window_started_at) = window_started_at"
           )
  end

  def down do
    drop table(:community_write_windows)
    drop table(:community_write_receipts)
  end
end
