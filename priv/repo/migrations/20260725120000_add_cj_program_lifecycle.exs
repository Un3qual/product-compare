defmodule ProductCompare.Repo.Migrations.AddCJProgramLifecycle do
  use Ecto.Migration

  def change do
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

    create unique_index(:cj_programs, [:entropy_id])

    create unique_index(:cj_programs, [:source_id, :advertiser_id],
             name: :cj_programs_source_advertiser_uq
           )

    create index(:merchant_feed_candidates, [:cj_program_id],
             name: :merchant_feed_candidates_cj_program_idx
           )
  end
end
