defmodule ProductCompare.Repo.Migrations.CreateComparisonSnapshots do
  use Ecto.Migration

  def change do
    create table(:comparison_snapshots) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :public_token, :string, null: false, size: 43
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :title, :string, size: 120
      add :payload, :map, null: false
      add :revoked_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:comparison_snapshots, [:entropy_id])
    create unique_index(:comparison_snapshots, [:public_token])
    create index(:comparison_snapshots, [:user_id, :inserted_at])

    create constraint(:comparison_snapshots, :comparison_snapshots_public_token_format,
             check: "public_token ~ '^[A-Za-z0-9_-]{43}$'"
           )
  end
end
