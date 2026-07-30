defmodule ProductCompare.Repo.Migrations.AddCJProgramLifecycleTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Repo

  defmodule MigrationRepo do
    use Ecto.Repo,
      otp_app: :product_compare,
      adapter: Ecto.Adapters.Postgres
  end

  @migration_path Application.app_dir(
                    :product_compare,
                    "priv/repo/migrations/20260725120000_add_cj_program_lifecycle.exs"
                  )
  @migration_version 20_260_725_120_000

  Code.require_file(@migration_path)

  setup do
    config =
      Repo.config()
      |> Keyword.put(:pool, DBConnection.ConnectionPool)
      |> Keyword.put(:pool_size, 3)

    start_supervised!({MigrationRepo, config})
    :ok
  end

  test "up groups CJ feed reviews into programs, preserves the newest note, and links matching feeds" do
    with_legacy_schema(fn prefix ->
      seed_legacy_cj_rows(prefix)

      assert :ok = migrate_up(prefix)

      assert program_rows(prefix) == [
               ["adv-dismissed", "not_pursuing"],
               ["adv-mixed", "new"],
               ["adv-shortlist", "considering"]
             ]

      assert linked_feed_count(prefix, "adv-shortlist") == 2
      assert unmatched_feed_count(prefix) == 1
      assert program_note(prefix, "adv-mixed") == "higher feed ID note"
      refute column_exists?(prefix, "merchant_feed_candidates", "review_status")
    end)
  end

  test "up enforces unique program identities and the closed stage set" do
    with_legacy_schema(fn prefix ->
      seed_legacy_cj_rows(prefix)
      assert :ok = migrate_up(prefix)

      assert {:error,
              %Postgrex.Error{
                postgres: %{constraint: "cj_programs_source_advertiser_uq"}
              }} =
               MigrationRepo.query("""
               INSERT INTO "#{prefix}"."cj_programs"
                 (source_id, advertiser_id, stage, changed_at, inserted_at, updated_at)
               VALUES (1, 'adv-shortlist', 'new', now(), now(), now())
               """)

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :invalid_text_representation,
                  message: "invalid input value for enum cj_program_stage: \"unknown\""
                }
              }} =
               MigrationRepo.query("""
               INSERT INTO "#{prefix}"."cj_programs"
                 (source_id, advertiser_id, stage, changed_at, inserted_at, updated_at)
               VALUES (1, 'adv-unknown', 'unknown', now(), now(), now())
               """)
    end)
  end

  test "up uses the selected nonblank note review time as the program change time" do
    with_legacy_schema(fn prefix ->
      note_reviewed_at = ~U[2026-07-25 12:00:00.000000Z]
      blank_note_reviewed_at = ~U[2026-07-25 13:00:00.000000Z]

      insert_legacy_cj_row(prefix, %{
        advertiser_id: "adv-note-time",
        review_note: "Keep this note",
        reviewed_at: note_reviewed_at
      })

      insert_legacy_cj_row(prefix, %{
        advertiser_id: "adv-note-time",
        review_note: "   ",
        reviewed_at: blank_note_reviewed_at
      })

      assert :ok = migrate_up(prefix)

      assert program_note_and_changed_at(prefix, "adv-note-time") == [
               "Keep this note",
               DateTime.to_naive(note_reviewed_at)
             ]
    end)
  end

  test "up preserves an unreviewed nonblank note and uses the grouped change-time fallback" do
    with_legacy_schema(fn prefix ->
      fallback_reviewed_at = ~U[2026-07-25 14:00:00.000000Z]

      insert_legacy_cj_row(prefix, %{
        advertiser_id: "adv-unreviewed-note",
        review_note: "Legacy note without a review time",
        reviewed_at: nil
      })

      insert_legacy_cj_row(prefix, %{
        advertiser_id: "adv-unreviewed-note",
        review_note: "   ",
        reviewed_at: fallback_reviewed_at
      })

      assert :ok = migrate_up(prefix)

      assert program_note_and_changed_at(prefix, "adv-unreviewed-note") == [
               "Legacy note without a review time",
               DateTime.to_naive(fallback_reviewed_at)
             ]
    end)
  end

  test "up refuses to discard reviewed CJ feeds that have no advertiser identity" do
    with_legacy_schema(fn prefix ->
      insert_legacy_cj_row(prefix, %{
        advertiser_id: "   ",
        review_status: "shortlisted",
        review_note: "Resolve the missing advertiser before migration",
        reviewed_at: ~U[2026-07-25 15:00:00.000000Z]
      })

      assert_raise Postgrex.Error, ~r/feed review state without a CJ program identity/, fn ->
        migrate_up(prefix)
      end
    end)
  end

  test "up refuses to discard reviewed non-CJ feed state" do
    with_legacy_schema(fn prefix ->
      MigrationRepo.query!("""
      INSERT INTO "#{prefix}"."merchant_feed_candidates"
        (source_id, provider, advertiser_id, review_status, review_note, reviewed_at)
      VALUES (1, 'impact', 'impact-advertiser', 'shortlisted', 'Keep this review', now())
      """)

      assert_raise Postgrex.Error, ~r/feed review state without a CJ program identity/, fn ->
        migrate_up(prefix)
      end
    end)
  end

  test "down restores legacy review fields and maps each lifecycle stage back to a review status" do
    with_legacy_schema(fn prefix ->
      seed_legacy_cj_rows(prefix)
      assert :ok = migrate_up(prefix)
      seed_post_migration_programs(prefix)
      assert :ok = migrate_down(prefix)

      assert review_status_rows(prefix) == [
               [1, "shortlisted"],
               [2, "shortlisted"],
               [3, "dismissed"],
               [4, "dismissed"],
               [5, "pending"],
               [6, "pending"],
               [7, "pending"],
               [8, "shortlisted"],
               [9, "shortlisted"],
               [10, "shortlisted"],
               [11, "dismissed"]
             ]

      assert column_exists?(prefix, "merchant_feed_candidates", "review_status")
      refute table_exists?(prefix, "cj_programs")
    end)
  end

  defp insert_legacy_cj_row(prefix, row) do
    MigrationRepo.query!(
      """
      INSERT INTO "#{prefix}"."merchant_feed_candidates"
        (source_id, provider, advertiser_id, review_status, review_note, reviewed_at)
      VALUES (1, 'cj', $1, $2, $3, $4)
      """,
      [
        row.advertiser_id,
        Map.get(row, :review_status, "pending"),
        Map.get(row, :review_note),
        Map.get(row, :reviewed_at)
      ]
    )
  end

  defp with_legacy_schema(fun) do
    prefix = "cj_program_migration_#{Ecto.UUID.generate() |> String.replace("-", "")}"
    MigrationRepo.query!(~s(CREATE SCHEMA "#{prefix}"))

    try do
      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."sources" (
        id bigserial PRIMARY KEY
      )
      """)

      MigrationRepo.query!("""
      CREATE TABLE "#{prefix}"."merchant_feed_candidates" (
        id bigserial PRIMARY KEY,
        source_id bigint NOT NULL REFERENCES "#{prefix}"."sources"(id),
        provider text NOT NULL,
        advertiser_id text,
        review_status text NOT NULL DEFAULT 'pending',
        review_note text,
        reviewed_at timestamptz
      )
      """)

      MigrationRepo.query!("""
      ALTER TABLE "#{prefix}"."merchant_feed_candidates"
      ADD CONSTRAINT merchant_feed_candidates_review_status_chk
      CHECK (review_status IN ('pending', 'shortlisted', 'dismissed'))
      """)

      MigrationRepo.query!("""
      CREATE INDEX merchant_feed_candidates_provider_review_status_idx
      ON "#{prefix}"."merchant_feed_candidates" (provider, review_status)
      """)

      MigrationRepo.query!("INSERT INTO \"#{prefix}\".\"sources\" (id) VALUES (1)")

      fun.(prefix)
    after
      MigrationRepo.query!(~s(DROP SCHEMA IF EXISTS "#{prefix}" CASCADE))
    end
  end

  defp seed_legacy_cj_rows(prefix) do
    reviewed_at = ~U[2026-07-25 12:00:00.000000Z]

    rows = [
      %{advertiser_id: " adv-shortlist ", review_status: "shortlisted"},
      %{advertiser_id: "adv-shortlist", review_status: "dismissed"},
      %{advertiser_id: "adv-dismissed", review_status: "dismissed"},
      %{advertiser_id: "adv-dismissed", review_status: "dismissed"},
      %{
        advertiser_id: "adv-mixed",
        review_status: "pending",
        review_note: "lower feed ID note",
        reviewed_at: reviewed_at
      },
      %{
        advertiser_id: "adv-mixed",
        review_status: "dismissed",
        review_note: "higher feed ID note",
        reviewed_at: reviewed_at
      },
      %{advertiser_id: " ", review_status: "pending"}
    ]

    Enum.each(rows, fn row ->
      MigrationRepo.query!(
        """
        INSERT INTO "#{prefix}"."merchant_feed_candidates"
          (source_id, provider, advertiser_id, review_status, review_note, reviewed_at)
        VALUES (1, 'cj', $1, $2, $3, $4)
        """,
        [
          row.advertiser_id,
          row.review_status,
          Map.get(row, :review_note),
          Map.get(row, :reviewed_at)
        ]
      )
    end)
  end

  defp migrate_up(prefix) do
    Ecto.Migrator.up(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddCJProgramLifecycle,
      prefix: prefix,
      log: false
    )
  end

  defp seed_post_migration_programs(prefix) do
    for {advertiser_id, stage} <- [
          {"adv-selected", "selected"},
          {"adv-applied", "applied"},
          {"adv-accepted", "accepted"},
          {"adv-declined", "declined"}
        ] do
      MigrationRepo.query!(
        """
        WITH program AS (
          INSERT INTO "#{prefix}"."cj_programs"
            (source_id, advertiser_id, stage, changed_at, inserted_at, updated_at)
          VALUES (1, $1, $2, now(), now(), now())
          RETURNING id
        )
        INSERT INTO "#{prefix}"."merchant_feed_candidates"
          (source_id, provider, advertiser_id, cj_program_id)
        SELECT 1, 'cj', $1, id
        FROM program
        """,
        [advertiser_id, stage]
      )
    end
  end

  defp migrate_down(prefix) do
    Ecto.Migrator.down(
      MigrationRepo,
      @migration_version,
      ProductCompare.Repo.Migrations.AddCJProgramLifecycle,
      prefix: prefix,
      log: false
    )
  end

  defp program_rows(prefix) do
    %{rows: rows} =
      MigrationRepo.query!("""
      SELECT advertiser_id, stage
      FROM "#{prefix}"."cj_programs"
      ORDER BY advertiser_id
      """)

    rows
  end

  defp review_status_rows(prefix) do
    %{rows: rows} =
      MigrationRepo.query!("""
      SELECT id, review_status
      FROM "#{prefix}"."merchant_feed_candidates"
      ORDER BY id
      """)

    rows
  end

  defp linked_feed_count(prefix, advertiser_id) do
    %{rows: [[count]]} =
      MigrationRepo.query!(
        """
        SELECT count(*)
        FROM "#{prefix}"."merchant_feed_candidates" AS feed
        JOIN "#{prefix}"."cj_programs" AS program ON program.id = feed.cj_program_id
        WHERE program.advertiser_id = $1
        """,
        [advertiser_id]
      )

    count
  end

  defp unmatched_feed_count(prefix) do
    %{rows: [[count]]} =
      MigrationRepo.query!("""
      SELECT count(*)
      FROM "#{prefix}"."merchant_feed_candidates"
      WHERE provider = 'cj' AND cj_program_id IS NULL
      """)

    count
  end

  defp program_note(prefix, advertiser_id) do
    %{rows: [[note]]} =
      MigrationRepo.query!(
        """
        SELECT note
        FROM "#{prefix}"."cj_programs"
        WHERE advertiser_id = $1
        """,
        [advertiser_id]
      )

    note
  end

  defp program_note_and_changed_at(prefix, advertiser_id) do
    %{rows: [[note, changed_at]]} =
      MigrationRepo.query!(
        """
        SELECT note, changed_at
        FROM "#{prefix}"."cj_programs"
        WHERE advertiser_id = $1
        """,
        [advertiser_id]
      )

    [note, changed_at]
  end

  defp column_exists?(prefix, table, column) do
    %{rows: [[count]]} =
      MigrationRepo.query!(
        """
        SELECT count(*)
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
          AND column_name = $3
        """,
        [prefix, table, column]
      )

    count == 1
  end

  defp table_exists?(prefix, table) do
    %{rows: [[count]]} =
      MigrationRepo.query!(
        """
        SELECT count(*)
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
        """,
        [prefix, table]
      )

    count == 1
  end
end
