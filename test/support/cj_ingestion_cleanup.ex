defmodule ProductCompare.TestSupport.CJIngestionCleanup do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  def cleanup! do
    RepoOnlyStartup.start!()

    source_ids =
      Source
      |> where([source], source.provider == "cj")
      |> select([source], source.id)
      |> Repo.all()

    Repo.delete_all(
      from candidate in MerchantFeedCandidate, where: candidate.source_id in ^source_ids
    )

    Repo.delete_all(from run in ImportRun, where: run.source_id in ^source_ids)

    unless source_ids == [] do
      Repo.delete_all(from source in Source, where: source.id in ^source_ids)
    end

    :ok
  end
end
