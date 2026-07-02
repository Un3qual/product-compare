defmodule ProductCompare.Ingestion.CJCandidateFreshnessTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJCandidateFreshness
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "summary/2" do
    test "returns CJ-only freshness buckets by review status" do
      now = ~U[2026-07-02 12:00:00Z]
      source = source_fixture()

      merchant_feed_candidate_fixture(source, %{
        last_seen_at: now,
        provider_feed_id: "cj-fresh",
        review_status: "pending"
      })

      merchant_feed_candidate_fixture(source, %{
        last_seen_at: DateTime.add(now, -72, :hour),
        provider_feed_id: "cj-aging",
        review_status: "shortlisted"
      })

      merchant_feed_candidate_fixture(source, %{
        last_seen_at: DateTime.add(now, -10, :day),
        provider_feed_id: "cj-stale",
        review_status: "dismissed"
      })

      merchant_feed_candidate_fixture(source, %{
        last_seen_at: now,
        provider: "awin",
        provider_feed_id: "awin-fresh",
        review_status: "shortlisted"
      })

      assert %{
               provider: "cj",
               fresh_hours: 48,
               stale_hours: 168,
               buckets: %{
                 fresh: %{
                   candidate_count: 1,
                   review_status_counts: %{
                     pending: 1,
                     shortlisted: 0,
                     dismissed: 0,
                     total: 1
                   }
                 },
                 aging: %{
                   candidate_count: 1,
                   review_status_counts: %{
                     pending: 0,
                     shortlisted: 1,
                     dismissed: 0,
                     total: 1
                   }
                 },
                 stale: %{
                   candidate_count: 1,
                   review_status_counts: %{
                     pending: 0,
                     shortlisted: 0,
                     dismissed: 1,
                     total: 1
                   }
                 }
               }
             } = CJCandidateFreshness.summary([], now)
    end

    test "normalizes invalid thresholds and clamps stale hours to fresh hours" do
      now = ~U[2026-07-02 12:00:00Z]

      assert %{fresh_hours: 48, stale_hours: 168} =
               CJCandidateFreshness.summary([fresh_hours: 0, stale_hours: "bad"], now)

      assert %{fresh_hours: 96, stale_hours: 96} =
               CJCandidateFreshness.summary([fresh_hours: 96, stale_hours: 24], now)
    end

    test "does not mutate candidates while summarizing freshness" do
      now = ~U[2026-07-02 12:00:00Z]
      source = source_fixture()

      candidate =
        merchant_feed_candidate_fixture(source, %{
          last_seen_at: DateTime.add(now, -10, :day),
          raw_metadata: %{"token" => "secret"},
          review_note: "Reviewed",
          review_status: "dismissed",
          reviewed_at: ~U[2026-07-01 12:00:00Z]
        })

      before_summary = Repo.get!(MerchantFeedCandidate, candidate.id)

      assert %{buckets: %{stale: %{candidate_count: 1}}} =
               CJCandidateFreshness.summary([], now)

      after_summary = Repo.get!(MerchantFeedCandidate, candidate.id)

      assert after_summary.review_status == before_summary.review_status
      assert after_summary.review_note == before_summary.review_note
      assert DateTime.compare(after_summary.reviewed_at, before_summary.reviewed_at) == :eq
      assert after_summary.raw_metadata == before_summary.raw_metadata
    end
  end

  defp source_fixture(attrs \\ %{}) do
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

  defp merchant_feed_candidate_fixture(source, attrs) do
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
          review_note: nil,
          review_status: "pending",
          reviewed_at: nil,
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, %MerchantFeedCandidate{} = candidate} =
             Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
  end
end
