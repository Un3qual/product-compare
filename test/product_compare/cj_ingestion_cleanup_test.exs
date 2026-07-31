defmodule ProductCompare.TestSupport.CJIngestionCleanupTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Repo
  alias ProductCompare.TestSupport.CJIngestionCleanup
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  test "cleanup removes records owned by CJ sources without touching other providers" do
    cj_source = source_fixture("Commission Junction", "cj")
    awin_source = source_fixture("CJ lookalike", "awin")

    cj_candidate = candidate_fixture(cj_source)
    awin_candidate = candidate_fixture(awin_source)
    cj_run = import_run_fixture(cj_source)
    awin_run = import_run_fixture(awin_source)

    assert :ok = CJIngestionCleanup.cleanup!()

    refute Repo.get(Source, cj_source.id)
    refute Repo.get(MerchantFeedCandidate, cj_candidate.id)
    refute Repo.get(ImportRun, cj_run.id)

    assert Repo.get!(Source, awin_source.id)
    assert Repo.get!(MerchantFeedCandidate, awin_candidate.id)
    assert Repo.get!(ImportRun, awin_run.id)
  end

  defp source_fixture(name, provider) do
    %Source{}
    |> Source.changeset(%{
      kind: "affiliate_feed",
      provider: provider,
      name: name,
      domain: "#{provider}.example"
    })
    |> Repo.insert!()
  end

  defp candidate_fixture(source) do
    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(%{
      source_id: source.id,
      provider_feed_id: "feed-#{source.id}",
      last_seen_at: ~U[2026-07-31 06:00:00Z]
    })
    |> Repo.insert!()
  end

  defp import_run_fixture(source) do
    %ImportRun{}
    |> ImportRun.changeset(%{
      source_id: source.id,
      surface: "shoppingProducts",
      query: %{},
      status: :succeeded,
      started_at: ~U[2026-07-31 06:00:00Z]
    })
    |> Repo.insert!()
  end
end
