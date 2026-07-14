defmodule ProductCompare.Repo.Migrations.AddCommunityModeration do
  use Ecto.Migration

  def change do
    alter table(:product_reviews) do
      add :moderation_status, :string, null: false, default: "published"
      add :moderation_note, :text
      add :moderated_at, :utc_datetime_usec
      add :moderated_by, references(:users, type: :bigint, on_delete: :nilify_all)
    end

    alter table(:product_threads) do
      add :kind, :string, null: false, default: "question"
      add :body_md, :text
      add :moderation_status, :string, null: false, default: "published"
      add :moderation_note, :text
      add :moderated_at, :utc_datetime_usec
      add :moderated_by, references(:users, type: :bigint, on_delete: :nilify_all)
      add :accepted_post_id, references(:thread_posts, type: :bigint, on_delete: :nilify_all)
    end

    alter table(:thread_posts) do
      add :moderation_status, :string, null: false, default: "published"
      add :moderation_note, :text
      add :moderated_at, :utc_datetime_usec
      add :moderated_by, references(:users, type: :bigint, on_delete: :nilify_all)
    end

    execute("UPDATE product_reviews SET verified_purchase = false", "SELECT 1")

    create index(:product_reviews, [:product_id, :moderation_status, :inserted_at])
    create index(:product_threads, [:product_id, :kind, :moderation_status, :inserted_at])
    create index(:thread_posts, [:thread_id, :moderation_status, :inserted_at])

    for table <- [:product_reviews, :product_threads, :thread_posts] do
      create constraint(table, String.to_atom("#{table}_moderation_status_check"),
               check: "moderation_status IN ('pending', 'published', 'hidden', 'rejected')"
             )
    end

    create constraint(:product_threads, :product_threads_kind_check, check: "kind = 'question'")

    create table(:community_reports) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :reporter_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :review_id, references(:product_reviews, type: :bigint, on_delete: :delete_all)
      add :thread_id, references(:product_threads, type: :bigint, on_delete: :delete_all)
      add :post_id, references(:thread_posts, type: :bigint, on_delete: :delete_all)
      add :reason, :string, null: false, size: 500
      add :status, :string, null: false, default: "pending"
      add :resolved_at, :utc_datetime_usec
      add :resolved_by, references(:users, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:community_reports, [:entropy_id])

    create unique_index(:community_reports, [:reporter_id, :review_id],
             where: "review_id IS NOT NULL"
           )

    create unique_index(:community_reports, [:reporter_id, :thread_id],
             where: "thread_id IS NOT NULL"
           )

    create unique_index(:community_reports, [:reporter_id, :post_id],
             where: "post_id IS NOT NULL"
           )

    create index(:community_reports, [:status, :inserted_at])

    create constraint(:community_reports, :community_reports_one_target,
             check:
               "((review_id IS NOT NULL)::int + (thread_id IS NOT NULL)::int + (post_id IS NOT NULL)::int) = 1"
           )

    create constraint(:community_reports, :community_reports_status_check,
             check: "status IN ('pending', 'resolved', 'dismissed')"
           )
  end
end
