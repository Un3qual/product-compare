defmodule ProductCompare.Repo.Migrations.AddCommunityWriteControls do
  use Ecto.Migration

  @content_tables [:product_reviews, :product_threads, :thread_posts]

  def up do
    Enum.each(@content_tables, fn table ->
      drop constraint(table, String.to_atom("#{table}_moderation_status_check"))

      create constraint(table, String.to_atom("#{table}_moderation_status_check"),
               check:
                 "moderation_status IN ('pending', 'published', 'hidden', 'rejected', 'removed')"
             )
    end)

    create table(:community_write_receipts) do
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :mutation_kind, :string, null: false
      add :idempotency_key, :string, size: 128, null: false
      add :payload_digest, :binary, null: false
      add :content_type, :string, null: false
      add :content_entropy_id, :uuid, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(
             :community_write_receipts,
             [:user_id, :mutation_kind, :idempotency_key],
             name: :community_write_receipts_user_mutation_key_uq
           )

    create index(:community_write_receipts, [:content_type, :content_entropy_id])

    create constraint(:community_write_receipts, :community_write_receipts_mutation_kind_check,
             check: "mutation_kind IN ('review', 'question', 'answer')"
           )

    create constraint(:community_write_receipts, :community_write_receipts_content_type_check,
             check: "content_type IN ('review', 'question', 'answer')"
           )

    create constraint(:community_write_receipts, :community_write_receipts_key_check,
             check:
               "char_length(idempotency_key) BETWEEN 16 AND 128 AND idempotency_key ~ '^[ -~]+$'"
           )

    create constraint(:community_write_receipts, :community_write_receipts_digest_check,
             check: "octet_length(payload_digest) = 32"
           )

    create table(:community_write_windows) do
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :action_kind, :string, null: false
      add :window_started_at, :utc_datetime_usec, null: false
      add :count, :integer, null: false, default: 0

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(
             :community_write_windows,
             [:user_id, :action_kind, :window_started_at],
             name: :community_write_windows_user_action_window_uq
           )

    create constraint(:community_write_windows, :community_write_windows_action_kind_check,
             check: "action_kind IN ('review', 'question', 'answer', 'report')"
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

    Enum.each(@content_tables, fn table ->
      drop constraint(table, String.to_atom("#{table}_moderation_status_check"))

      create constraint(table, String.to_atom("#{table}_moderation_status_check"),
               check: "moderation_status IN ('pending', 'published', 'hidden', 'rejected')"
             )
    end)
  end
end
