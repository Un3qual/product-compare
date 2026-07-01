defmodule ProductCompare.Ingestion.CJCandidateCohortTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJCandidateCohort
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "summary/1" do
    test "returns CJ-only review counts and top shortlisted candidates ordered by fit score" do
      source = source_fixture()

      merchant_feed_candidate_fixture(source, %{
        provider_feed_id: "cj-pending",
        review_status: "pending"
      })

      merchant_feed_candidate_fixture(source, %{
        provider_feed_id: "cj-dismissed",
        review_status: "dismissed"
      })

      score_85 =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "Trail Feed",
          language: "EN",
          product_count: 5_000,
          provider_feed_id: "cj-score-85",
          review_status: "shortlisted",
          source_feed_type: "PRODUCT"
        })

      score_65 =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_name: "Global Merchant",
          currency: "CAD",
          feed_name: "Global Feed",
          language: "EN",
          product_count: 20_000,
          provider_feed_id: "cj-score-65",
          review_status: "shortlisted",
          source_feed_type: "PRODUCT"
        })

      score_55 =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Budget Merchant",
          currency: "USD",
          feed_name: "Budget Feed",
          language: nil,
          product_count: 500,
          provider_feed_id: "cj-score-55",
          review_status: "shortlisted",
          source_feed_type: nil
        })

      merchant_feed_candidate_fixture(source, %{
        provider: "awin",
        provider_feed_id: "awin-score-100",
        review_status: "shortlisted"
      })

      assert %{
               review_status_counts: %{
                 pending: 1,
                 shortlisted: 3,
                 dismissed: 1,
                 total: 5
               },
               top_shortlisted_candidates: top_shortlisted_candidates,
               limit: 10
             } = CJCandidateCohort.summary()

      assert Enum.map(top_shortlisted_candidates, & &1.id) == [
               score_85.id,
               score_65.id,
               score_55.id
             ]

      assert Enum.map(top_shortlisted_candidates, & &1.fit_score) == [85, 65, 55]
    end

    test "orders same-score shortlisted CJ candidates by newer last_seen_at first" do
      source = source_fixture()

      older =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Aardvark Tie Merchant",
          currency: nil,
          feed_name: "A Tie Feed",
          language: nil,
          last_seen_at: ~U[2026-06-04 19:00:00Z],
          product_count: nil,
          provider_feed_id: "cj-older-tie",
          review_status: "shortlisted",
          source_feed_type: "PRODUCT"
        })

      newer =
        merchant_feed_candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Zebra Tie Merchant",
          currency: nil,
          feed_name: "Z Tie Feed",
          language: nil,
          last_seen_at: ~U[2026-06-04 21:00:00Z],
          product_count: nil,
          provider_feed_id: "cj-newer-tie",
          review_status: "shortlisted",
          source_feed_type: "PRODUCT"
        })

      assert %{top_shortlisted_candidates: top_shortlisted_candidates} =
               CJCandidateCohort.summary()

      assert Enum.map(top_shortlisted_candidates, & &1.id) == [newer.id, older.id]
      assert Enum.map(top_shortlisted_candidates, & &1.fit_score) == [25, 25]
    end

    test "normalizes limit option with default, strings, clamps, and fallback" do
      source = source_fixture()
      merchant_feed_candidate_fixture(source)

      assert %{limit: 10} = CJCandidateCohort.summary()
      assert %{limit: 2} = CJCandidateCohort.summary(limit: "2")
      assert %{limit: 1} = CJCandidateCohort.summary(limit: 0)
      assert %{limit: 50} = CJCandidateCohort.summary(limit: 100)
      assert %{limit: 10} = CJCandidateCohort.summary(limit: "invalid")
    end

    test "returns only safe candidate fields without raw metadata or sensitive-looking keys" do
      source = source_fixture()

      candidate =
        merchant_feed_candidate_fixture(source, %{
          provider_feed_id: "cj-sensitive-metadata",
          raw_metadata: %{
            "token" => "secret-token",
            "account_id" => "acct-123",
            "tracking_params" => %{"sid" => "secret"},
            "query" => %{"keywords" => "boots"},
            "provider_payload" => %{"raw" => true}
          },
          review_status: "shortlisted"
        })

      assert %{top_shortlisted_candidates: [%{id: candidate_id} = returned_candidate]} =
               CJCandidateCohort.summary()

      assert candidate_id == candidate.id

      returned_keys = returned_candidate |> Map.keys() |> MapSet.new()

      assert returned_keys ==
               MapSet.new([
                 :id,
                 :provider,
                 :provider_feed_id,
                 :advertiser_id,
                 :advertiser_name,
                 :advertiser_country,
                 :source_feed_type,
                 :currency,
                 :language,
                 :feed_name,
                 :product_count,
                 :review_status,
                 :review_note,
                 :reviewed_at,
                 :provider_last_updated_at,
                 :last_seen_at,
                 :inserted_at,
                 :updated_at,
                 :fit_score
               ])

      refute MapSet.member?(returned_keys, :raw_metadata)
      refute MapSet.member?(returned_keys, :credentials)
      refute MapSet.member?(returned_keys, :account_id)
      refute MapSet.member?(returned_keys, :tracking_params)
      refute MapSet.member?(returned_keys, :query)
      refute MapSet.member?(returned_keys, :provider_payload)
    end

    test "does not mutate candidate review or metadata fields" do
      source = source_fixture()

      candidate =
        merchant_feed_candidate_fixture(source, %{
          provider_feed_id: "cj-read-only",
          raw_metadata: %{
            "token" => "secret-token",
            "account_id" => "acct-123",
            "tracking_params" => %{"sid" => "secret"}
          },
          review_note: "Already reviewed",
          review_status: "shortlisted",
          reviewed_at: ~U[2026-06-05 12:00:00Z]
        })

      before_summary = Repo.get!(MerchantFeedCandidate, candidate.id)

      assert %{top_shortlisted_candidates: [_candidate]} = CJCandidateCohort.summary()

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

  defp merchant_feed_candidate_fixture(source, attrs \\ %{}) do
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
          last_seen_at: ~U[2026-06-04 20:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{suffix}",
          provider_last_updated_at: ~U[2026-06-04 20:00:00Z],
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
