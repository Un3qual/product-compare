defmodule ProductCompare.Repo.Migrations.TightenSourceArtifactsSourceFk do
  use Ecto.Migration

  def up do
    # Fail fast so ownership issues are fixed before constraints are tightened.
    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM source_artifacts
        WHERE source_id IS NULL
      ) THEN
        RAISE EXCEPTION
          'Cannot enforce source_artifacts.source_id NOT NULL + delete_all FK: NULL source_id rows exist; backfill source ownership first.';
      END IF;
    END
    $$;
    """)

    alter table(:source_artifacts) do
      modify :source_id,
             references(:sources, type: :bigint, on_delete: :delete_all),
             null: false,
             from: references(:sources, type: :bigint, on_delete: :nilify_all)
    end
  end

  def down do
    alter table(:source_artifacts) do
      modify :source_id,
             references(:sources, type: :bigint, on_delete: :nilify_all),
             null: true,
             from: references(:sources, type: :bigint, on_delete: :delete_all)
    end
  end
end
