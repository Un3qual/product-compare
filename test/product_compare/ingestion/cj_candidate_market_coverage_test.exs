defmodule ProductCompare.Ingestion.CJCandidateMarketCoverageTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJCandidateMarketCoverage
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "summary/1" do
    test "returns safe CJ-only coverage buckets" do
      source = source_fixture()

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: " US ",
        currency: " usd ",
        language: " en ",
        provider_feed_id: "cj-us-pending",
        review_status: "pending",
        source_feed_type: " shopping "
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "US",
        currency: "USD",
        language: "EN",
        provider_feed_id: "cj-us-shortlisted",
        review_status: "shortlisted",
        source_feed_type: "SHOPPING"
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: " ca ",
        currency: " cad ",
        language: " fr ",
        provider_feed_id: "cj-ca-pending",
        review_status: "pending",
        source_feed_type: " product "
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: nil,
        currency: "",
        language: "   ",
        provider_feed_id: "cj-unknown-market",
        review_status: "pending",
        source_feed_type: nil
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "US",
        currency: "USD",
        language: "EN",
        provider: "awin",
        provider_feed_id: "awin-us-shortlisted",
        review_status: "shortlisted",
        source_feed_type: "SHOPPING"
      })

      assert %{
               provider: "cj",
               review_status_filter: nil,
               total_candidate_count: 4,
               shortlisted_candidate_count: 1,
               dimensions: %{
                 advertiser_country: [
                   %{bucket: "US", candidate_count: 2, shortlisted_candidate_count: 1},
                   %{bucket: "CA", candidate_count: 1, shortlisted_candidate_count: 0},
                   %{bucket: "unknown", candidate_count: 1, shortlisted_candidate_count: 0}
                 ],
                 currency: [
                   %{bucket: "USD", candidate_count: 2, shortlisted_candidate_count: 1},
                   %{bucket: "CAD", candidate_count: 1, shortlisted_candidate_count: 0},
                   %{bucket: "unknown", candidate_count: 1, shortlisted_candidate_count: 0}
                 ],
                 language: [
                   %{bucket: "EN", candidate_count: 2, shortlisted_candidate_count: 1},
                   %{bucket: "FR", candidate_count: 1, shortlisted_candidate_count: 0},
                   %{bucket: "unknown", candidate_count: 1, shortlisted_candidate_count: 0}
                 ],
                 source_feed_type: [
                   %{bucket: "SHOPPING", candidate_count: 2, shortlisted_candidate_count: 1},
                   %{bucket: "PRODUCT", candidate_count: 1, shortlisted_candidate_count: 0},
                   %{bucket: "unknown", candidate_count: 1, shortlisted_candidate_count: 0}
                 ]
               }
             } = summary = CJCandidateMarketCoverage.summary([])

      assert_safe_summary(summary)
    end

    test "applies supported review status filters" do
      source = source_fixture()

      merchant_feed_candidate_fixture(source)

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "CA",
        provider_feed_id: "cj-shortlisted",
        review_status: "shortlisted"
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "MX",
        provider_feed_id: "cj-dismissed",
        review_status: "dismissed"
      })

      assert %{
               review_status_filter: "pending",
               total_candidate_count: 1,
               shortlisted_candidate_count: 0,
               dimensions: %{
                 advertiser_country: [
                   %{bucket: "US", candidate_count: 1, shortlisted_candidate_count: 0}
                 ]
               }
             } = CJCandidateMarketCoverage.summary(review_status: "pending")

      assert %{
               review_status_filter: "shortlisted",
               total_candidate_count: 1,
               shortlisted_candidate_count: 1,
               dimensions: %{
                 advertiser_country: [
                   %{bucket: "CA", candidate_count: 1, shortlisted_candidate_count: 1}
                 ],
                 currency: [
                   %{bucket: "USD", candidate_count: 1, shortlisted_candidate_count: 1}
                 ],
                 language: [
                   %{bucket: "EN", candidate_count: 1, shortlisted_candidate_count: 1}
                 ],
                 source_feed_type: [
                   %{bucket: "SHOPPING", candidate_count: 1, shortlisted_candidate_count: 1}
                 ]
               }
             } = CJCandidateMarketCoverage.summary(review_status: "shortlisted")

      assert %{
               review_status_filter: "dismissed",
               total_candidate_count: 1,
               shortlisted_candidate_count: 0,
               dimensions: %{
                 advertiser_country: [
                   %{bucket: "MX", candidate_count: 1, shortlisted_candidate_count: 0}
                 ]
               }
             } = CJCandidateMarketCoverage.summary(review_status: "dismissed")
    end

    test "ignores unsupported review status filters" do
      source = source_fixture()

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "US",
        provider_feed_id: "cj-pending",
        review_status: "pending"
      })

      merchant_feed_candidate_fixture(source, %{
        advertiser_country: "CA",
        provider_feed_id: "cj-shortlisted",
        review_status: "shortlisted"
      })

      baseline = CJCandidateMarketCoverage.summary([])

      assert CJCandidateMarketCoverage.summary(review_status: "needs_review") == baseline
      assert CJCandidateMarketCoverage.summary(review_status: " ") == baseline
      assert CJCandidateMarketCoverage.summary(review_status: :shortlisted) == baseline
      assert CJCandidateMarketCoverage.summary(review_status: nil) == baseline
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
          last_seen_at: ~U[2026-07-01 18:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-#{suffix}",
          provider_last_updated_at: ~U[2026-07-01 18:00:00Z],
          raw_metadata: %{"credential" => "do-not-return"},
          review_status: "pending",
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, %MerchantFeedCandidate{} = candidate} =
             Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
  end

  defp assert_safe_summary(summary) do
    sensitive_keys =
      MapSet.new([
        :account_id,
        :account_ids,
        :advertiser_id,
        :artifact_url,
        :credentials,
        :error_summary,
        :import_query,
        :provider_error_payload,
        :provider_payload,
        :query,
        :raw_json,
        :raw_metadata,
        :raw_provider_payload,
        :raw_text,
        :tracking,
        :tracking_params,
        :url
      ])

    summary_keys = summary |> Map.keys() |> MapSet.new()
    assert MapSet.disjoint?(summary_keys, sensitive_keys)

    assert Map.keys(summary) |> Enum.sort() ==
             [
               :dimensions,
               :provider,
               :review_status_filter,
               :shortlisted_candidate_count,
               :total_candidate_count
             ]

    Enum.each(summary.dimensions, fn {_dimension, rows} ->
      Enum.each(rows, fn row ->
        assert Map.keys(row) |> Enum.sort() == [
                 :bucket,
                 :candidate_count,
                 :shortlisted_candidate_count
               ]

        row_keys = row |> Map.keys() |> MapSet.new()
        assert MapSet.disjoint?(row_keys, sensitive_keys)
      end)
    end)
  end
end
