defmodule ProductCompare.Fixtures.CJIngestionFixtures do
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  def source_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  def merchant_feed_candidate_fixture(source, attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    attrs =
      Map.merge(
        %{
          advertiser_country: "US",
          advertiser_id: "adv-#{suffix}",
          advertiser_name: "Merchant #{suffix}",
          currency: "USD",
          feed_name: "Feed #{suffix}",
          language: "EN",
          last_seen_at: ~U[2026-07-01 18:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{suffix}",
          provider_last_updated_at: ~U[2026-07-01 18:00:00Z],
          raw_metadata: %{},
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    {:ok, %MerchantFeedCandidate{} = candidate} =
      Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
  end

  def cj_program_fixture(source, attrs \\ %{}) do
    suffix = System.unique_integer([:positive])
    advertiser_id = Map.get(attrs, :advertiser_id, "adv-#{suffix}")

    candidate =
      merchant_feed_candidate_fixture(source, %{
        advertiser_id: advertiser_id,
        provider_feed_id: "program-feed-#{suffix}"
      })

    program = Repo.get!(CJProgram, candidate.cj_program_id)

    if Map.has_key?(attrs, :stage) or Map.has_key?(attrs, :note) do
      {:ok, program} =
        CJPrograms.update_lifecycle(
          program.entropy_id,
          %{
            stage: Map.get(attrs, :stage, program.stage),
            note: Map.get(attrs, :note, program.note)
          },
          Map.get(attrs, :changed_at, DateTime.utc_now())
        )

      program
    else
      program
    end
  end

  def import_run_fixture(source, attrs \\ %{}) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          surface: "shoppingProducts",
          query: %{"accountId" => "secret"},
          status: "succeeded",
          started_at: ~U[2026-07-02 12:00:00Z],
          finished_at: ~U[2026-07-02 12:05:00Z],
          cursor_start: nil,
          cursor_end: nil,
          page_size: 50,
          pages_requested: 1,
          pages_fetched: 1,
          records_fetched: 1,
          records_normalized: 1,
          records_persisted: 1,
          records_failed: 0,
          error_summary: nil
        },
        attrs
      )

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert!()
  end
end
