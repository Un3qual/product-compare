defmodule ProductCompare.Repo.Migrations.AddIngestionReplayIdempotencyIndexes do
  use Ecto.Migration

  def change do
    create unique_index(:source_artifacts, [:source_id, :content_hash],
             name: :source_artifacts_source_content_hash_uq,
             where: "content_hash IS NOT NULL"
           )

    create unique_index(:price_points, [:merchant_product_id, :observed_at, :artifact_id],
             name: :price_points_mp_time_artifact_uq,
             where: "artifact_id IS NOT NULL"
           )
  end
end
