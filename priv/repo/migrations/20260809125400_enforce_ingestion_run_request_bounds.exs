defmodule ProductCompare.Repo.Migrations.EnforceIngestionRunRequestBounds do
  use Ecto.Migration

  def up do
    create constraint(:ingestion_runs, :ingestion_runs_page_size_positive,
             check: "page_size IS NULL OR page_size > 0"
           )

    create constraint(:ingestion_runs, :ingestion_runs_pages_requested_positive,
             check: "pages_requested IS NULL OR pages_requested > 0"
           )
  end

  def down do
    drop constraint(:ingestion_runs, :ingestion_runs_pages_requested_positive)
    drop constraint(:ingestion_runs, :ingestion_runs_page_size_positive)
  end
end
