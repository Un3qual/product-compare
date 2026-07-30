defmodule ProductCompare.Repo.Migrations.AddCJProgramLifecycle do
  use Ecto.Migration

  def up do
    programs = qualified_table(:cj_programs)
    feeds = qualified_table(:merchant_feed_candidates)

    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM #{feeds}
        WHERE (
          review_status <> 'pending'
          OR NULLIF(BTRIM(review_note), '') IS NOT NULL
          OR reviewed_at IS NOT NULL
        )
          AND (
            provider IS DISTINCT FROM 'cj'
            OR NULLIF(BTRIM(advertiser_id), '') IS NULL
          )
      ) THEN
        RAISE EXCEPTION
          'cannot migrate feed review state without a CJ program identity';
      END IF;
    END
    $$;
    """)

    create table(:cj_programs) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false

      add :advertiser_id, :text, null: false
      add :stage, :cj_program_stage, null: false, default: "new"
      add :note, :text
      add :changed_at, :utc_datetime_usec, null: false
      timestamps(type: :utc_datetime_usec)
    end

    alter table(:merchant_feed_candidates) do
      add :cj_program_id,
          references(:cj_programs, type: :bigint, on_delete: :nilify_all)
    end

    execute("""
    INSERT INTO #{programs} (
      source_id,
      advertiser_id,
      stage,
      note,
      changed_at,
      inserted_at,
      updated_at
    )
    SELECT grouped.source_id,
           grouped.advertiser_id,
           grouped.stage::cj_program_stage,
           notes.review_note,
           COALESCE(notes.changed_at, grouped.fallback_changed_at),
           NOW(),
           NOW()
    FROM (
      SELECT source_id,
             BTRIM(advertiser_id) AS advertiser_id,
             CASE
               WHEN bool_or(review_status = 'shortlisted') THEN 'considering'
               WHEN bool_and(review_status = 'dismissed') THEN 'not_pursuing'
               ELSE 'new'
             END AS stage,
             COALESCE(MAX(reviewed_at), NOW()) AS fallback_changed_at
      FROM #{feeds}
      WHERE provider = 'cj'
        AND NULLIF(BTRIM(advertiser_id), '') IS NOT NULL
      GROUP BY source_id, BTRIM(advertiser_id)
    ) AS grouped
    LEFT JOIN (
      SELECT DISTINCT ON (source_id, BTRIM(advertiser_id))
             source_id,
             BTRIM(advertiser_id) AS advertiser_id,
             review_note,
             reviewed_at AS changed_at
      FROM #{feeds}
      WHERE provider = 'cj'
        AND NULLIF(BTRIM(advertiser_id), '') IS NOT NULL
        AND NULLIF(BTRIM(review_note), '') IS NOT NULL
      ORDER BY source_id, BTRIM(advertiser_id), reviewed_at DESC NULLS LAST, id DESC
    ) AS notes
      ON notes.source_id = grouped.source_id
     AND notes.advertiser_id = grouped.advertiser_id
    """)

    create unique_index(:cj_programs, [:entropy_id])

    create unique_index(:cj_programs, [:source_id, :advertiser_id],
             name: :cj_programs_source_advertiser_uq
           )

    create index(:merchant_feed_candidates, [:cj_program_id],
             name: :merchant_feed_candidates_cj_program_idx
           )

    execute("""
    UPDATE #{feeds} AS feed
    SET cj_program_id = program.id
    FROM #{programs} AS program
    WHERE feed.provider = 'cj'
      AND program.source_id = feed.source_id
      AND program.advertiser_id = BTRIM(feed.advertiser_id)
      AND NULLIF(BTRIM(feed.advertiser_id), '') IS NOT NULL
    """)

    drop index(:merchant_feed_candidates, [:provider, :review_status],
           name: :merchant_feed_candidates_provider_review_status_idx
         )

    drop constraint(
           :merchant_feed_candidates,
           :merchant_feed_candidates_review_status_chk
         )

    alter table(:merchant_feed_candidates) do
      remove :review_status
      remove :review_note
      remove :reviewed_at
    end
  end

  def down do
    programs = qualified_table(:cj_programs)
    feeds = qualified_table(:merchant_feed_candidates)

    alter table(:merchant_feed_candidates) do
      add :review_status, :text, null: false, default: "pending"
      add :review_note, :text
      add :reviewed_at, :utc_datetime_usec
    end

    create constraint(
             :merchant_feed_candidates,
             :merchant_feed_candidates_review_status_chk,
             check: "review_status IN ('pending', 'shortlisted', 'dismissed')"
           )

    execute("""
    UPDATE #{feeds} AS feed
    SET review_status = CASE program.stage
                          WHEN 'new' THEN 'pending'
                          WHEN 'considering' THEN 'shortlisted'
                          WHEN 'selected' THEN 'shortlisted'
                          WHEN 'applied' THEN 'shortlisted'
                          WHEN 'accepted' THEN 'shortlisted'
                          WHEN 'not_pursuing' THEN 'dismissed'
                          WHEN 'declined' THEN 'dismissed'
                        END,
        review_note = program.note,
        reviewed_at = program.changed_at
    FROM #{programs} AS program
    WHERE feed.cj_program_id = program.id
    """)

    create index(:merchant_feed_candidates, [:provider, :review_status],
             name: :merchant_feed_candidates_provider_review_status_idx
           )

    alter table(:merchant_feed_candidates) do
      remove :cj_program_id
    end

    drop table(:cj_programs)
  end

  defp qualified_table(table) do
    case prefix() do
      nil -> Atom.to_string(table)
      migration_prefix -> ~s("#{migration_prefix}"."#{table}")
    end
  end
end
