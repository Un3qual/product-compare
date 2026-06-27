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
      |> where([source], source.kind == "affiliate_feed")
      |> where([source], like(source.name, "CJ%"))
      |> select([source], source.id)
      |> Repo.all()

    Repo.delete_all(from candidate in MerchantFeedCandidate, where: candidate.provider == "cj")
    Repo.delete_all(from run in ImportRun, where: run.provider == "cj")

    unless source_ids == [] do
      Repo.delete_all(from source in Source, where: source.id in ^source_ids)
    end

    :ok
  end
end
