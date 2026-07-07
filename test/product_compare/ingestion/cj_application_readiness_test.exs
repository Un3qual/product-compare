defmodule ProductCompare.Ingestion.CJApplicationReadinessTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion.CJApplicationReadiness
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  describe "summary/1" do
    test "returns empty readiness when no shortlisted CJ candidates exist" do
      assert %{
               provider: "cj",
               limit: 25,
               shortlisted_candidate_count: 0,
               ready_candidate_count: 0,
               blocked_candidate_count: 0,
               ready_candidates: [],
               blocked_candidates: []
             } = CJApplicationReadiness.summary()
    end

    test "returns ready shortlisted CJ candidates sorted by product count name and feed id" do
      source = source_fixture()

      lower_count =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Beta Merchant",
          product_count: 10,
          provider_feed_id: "cj-ready-beta",
          review_status: "shortlisted"
        })

      alpha_same_count =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          product_count: 50,
          provider_feed_id: "cj-ready-alpha-b",
          review_status: "shortlisted"
        })

      alpha_feed_tiebreak =
        merchant_feed_candidate_fixture(source, %{
          advertiser_name: "Alpha Merchant",
          product_count: 50,
          provider_feed_id: "cj-ready-alpha-a",
          review_status: "shortlisted"
        })

      merchant_feed_candidate_fixture(source, %{
        provider_feed_id: "cj-pending-ignored",
        review_status: "pending"
      })

      merchant_feed_candidate_fixture(source, %{
        provider: "awin",
        provider_feed_id: "awin-shortlisted-ignored",
        review_status: "shortlisted"
      })

      assert %{
               shortlisted_candidate_count: 3,
               ready_candidate_count: 3,
               blocked_candidate_count: 0,
               ready_candidates: ready_candidates,
               blocked_candidates: []
             } = CJApplicationReadiness.summary()

      assert Enum.map(ready_candidates, & &1.id) == [
               alpha_feed_tiebreak.id,
               alpha_same_count.id,
               lower_count.id
             ]

      assert Enum.all?(ready_candidates, &(&1.reason_codes == []))
      assert_safe_candidate_maps(ready_candidates)
    end

    test "returns blocked shortlisted CJ candidates with deterministic reason codes" do
      source = source_fixture()

      blocked =
        raw_merchant_feed_candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: " ",
          advertiser_name: nil,
          currency: "CAD",
          language: "FR",
          product_count: 0,
          provider_feed_id: "",
          raw_metadata: %{
            "account_id" => "secret",
            "tracking_params" => %{"sid" => "secret"}
          },
          review_status: "shortlisted"
        })

      merchant_feed_candidate_fixture(source, %{
        advertiser_name: nil,
        provider_feed_id: "cj-pending-blocked-ignored",
        review_status: "pending"
      })

      assert %{
               shortlisted_candidate_count: 1,
               ready_candidate_count: 0,
               blocked_candidate_count: 1,
               ready_candidates: [],
               blocked_candidates: [
                 %{
                   id: blocked_id,
                   reason_codes: [
                     :missing_advertiser,
                     :missing_feed_id,
                     :missing_product_count,
                     :non_us_market,
                     :non_usd_currency,
                     :non_english_language
                   ]
                 } = blocked_candidate
               ]
             } = CJApplicationReadiness.summary()

      assert blocked_id == blocked.id
      assert_safe_candidate_maps([blocked_candidate])
    end

    test "normalizes limit and keeps aggregate counts uncapped" do
      source = source_fixture()

      ready_candidates =
        for index <- 1..3 do
          merchant_feed_candidate_fixture(source, %{
            advertiser_name: "Ready Merchant #{index}",
            product_count: 100 - index,
            provider_feed_id: "cj-ready-#{index}",
            review_status: "shortlisted"
          })
        end

      blocked_candidates =
        for index <- 1..2 do
          merchant_feed_candidate_fixture(source, %{
            advertiser_name: nil,
            provider_feed_id: "cj-blocked-#{index}",
            review_status: "shortlisted"
          })
        end

      assert %{
               limit: 2,
               shortlisted_candidate_count: 5,
               ready_candidate_count: 3,
               blocked_candidate_count: 2,
               ready_candidates: limited_ready_candidates,
               blocked_candidates: limited_blocked_candidates
             } = CJApplicationReadiness.summary(%{"limit" => "2"})

      assert Enum.map(limited_ready_candidates, & &1.id) ==
               ready_candidates |> Enum.take(2) |> Enum.map(& &1.id)

      assert Enum.map(limited_blocked_candidates, & &1.id) ==
               Enum.map(blocked_candidates, & &1.id)

      assert %{limit: 1} = CJApplicationReadiness.summary(limit: 0)
      assert %{limit: 100} = CJApplicationReadiness.summary(limit: 101)
      assert %{limit: 25} = CJApplicationReadiness.summary(limit: "bad")
      assert %{limit: 25} = CJApplicationReadiness.summary(["not-an-option"])
    end

    test "classifies nil readiness fields as blocked" do
      source = source_fixture()

      blocked =
        raw_merchant_feed_candidate_fixture(source, %{
          advertiser_country: nil,
          advertiser_id: "adv-nil-fields",
          advertiser_name: "Nil Fields Merchant",
          currency: nil,
          language: nil,
          product_count: nil,
          provider_feed_id: "cj-nil-fields",
          review_status: "shortlisted"
        })

      assert %{
               ready_candidate_count: 0,
               blocked_candidate_count: 1,
               blocked_candidates: [
                 %{
                   id: blocked_id,
                   reason_codes: [
                     :missing_product_count,
                     :non_us_market,
                     :non_usd_currency,
                     :non_english_language
                   ]
                 }
               ]
             } = CJApplicationReadiness.summary()

      assert blocked_id == blocked.id
    end

    test "does not mutate candidate review or metadata fields" do
      source = source_fixture()

      candidate =
        merchant_feed_candidate_fixture(source, %{
          provider_feed_id: "cj-read-only",
          raw_metadata: %{
            "account_id" => "secret",
            "tracking_params" => %{"sid" => "secret"}
          },
          review_note: "Ready for review",
          review_status: "shortlisted",
          reviewed_at: ~U[2026-07-01 18:00:00Z]
        })

      before_summary = Repo.get!(MerchantFeedCandidate, candidate.id)

      assert %{ready_candidate_count: 1} = CJApplicationReadiness.summary()

      after_summary = Repo.get!(MerchantFeedCandidate, candidate.id)

      assert after_summary.review_status == before_summary.review_status
      assert after_summary.review_note == before_summary.review_note
      assert DateTime.compare(after_summary.reviewed_at, before_summary.reviewed_at) == :eq
      assert after_summary.raw_metadata == before_summary.raw_metadata
    end
  end

  defp raw_merchant_feed_candidate_fixture(source, attrs) do
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
          last_seen_at: ~U[2026-07-01 18:00:00.000000Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{suffix}",
          provider_last_updated_at: ~U[2026-07-01 18:00:00.000000Z],
          raw_metadata: %{},
          review_note: nil,
          review_status: "pending",
          reviewed_at: nil,
          source_feed_type: "SHOPPING",
          source_id: source.id
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> struct(attrs)
    |> Repo.insert!()
  end

  defp assert_safe_candidate_maps(candidates) do
    Enum.each(candidates, fn candidate ->
      keys = candidate |> Map.keys() |> MapSet.new()

      assert keys ==
               MapSet.new([
                 :id,
                 :provider_feed_id,
                 :advertiser_id,
                 :advertiser_name,
                 :advertiser_country,
                 :currency,
                 :language,
                 :feed_name,
                 :product_count,
                 :review_status,
                 :reason_codes
               ])

      refute MapSet.member?(keys, :raw_metadata)
      refute MapSet.member?(keys, :credentials)
      refute MapSet.member?(keys, :account_id)
      refute MapSet.member?(keys, :tracking_params)
      refute MapSet.member?(keys, :provider_payload)
    end)
  end
end
