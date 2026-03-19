defmodule ProductCompare.Repo.Migrations.CreateSavedComparisonSets do
  use Ecto.Migration

  def change do
    create table(:saved_comparison_sets) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :name, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:saved_comparison_sets, [:user_id, :inserted_at],
             name: :saved_comparison_sets_user_time_idx
           )

    create unique_index(:saved_comparison_sets, [:entropy_id])

    create table(:saved_comparison_items) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :saved_comparison_set_id,
          references(:saved_comparison_sets, type: :bigint, on_delete: :delete_all),
          null: false

      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :position, :integer, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:saved_comparison_items, [:entropy_id])

    create unique_index(:saved_comparison_items, [:saved_comparison_set_id, :position],
             name: :saved_comparison_items_set_position_uq
           )

    create unique_index(:saved_comparison_items, [:saved_comparison_set_id, :product_id],
             name: :saved_comparison_items_set_product_uq
           )

    create constraint(:saved_comparison_items, :saved_comparison_items_position_range,
             check: "position BETWEEN 1 AND 3"
           )
  end
end
