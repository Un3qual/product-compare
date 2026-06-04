defmodule ProductCompareWeb.GraphQL.MerchantFeedCandidateQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  describe "/api/graphql merchant feed candidate queries" do
    test "merchantFeedCandidates returns review-safe candidate fields with pagination", %{
      conn: conn
    } do
      source = source_fixture()
      first_seen_at = ~U[2026-06-04 20:00:00Z]
      second_seen_at = ~U[2026-06-04 21:00:00Z]

      {:ok, first_candidate} =
        Ingestion.upsert_merchant_feed_candidate(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "Trail Shopping",
          language: "EN",
          last_seen_at: first_seen_at,
          product_count: 10,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: first_seen_at,
          raw_metadata: %{"accountId" => "redacted", "tracking" => "not-for-browser"},
          source_feed_type: "SHOPPING"
        })

      {:ok, second_candidate} =
        Ingestion.upsert_merchant_feed_candidate(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-2",
          advertiser_name: "Urban Merchant",
          currency: "CAD",
          feed_name: "Urban Shopping",
          language: "FR",
          last_seen_at: second_seen_at,
          product_count: 5,
          provider: "cj",
          provider_feed_id: "feed-2",
          provider_last_updated_at: second_seen_at,
          raw_metadata: %{"accountId" => "redacted", "tracking" => "not-for-browser"},
          source_feed_type: "SHOPPING"
        })

      assert %{
               "data" => %{
                 "merchantFeedCandidates" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "provider" => "cj",
                         "providerFeedId" => "feed-1",
                         "advertiserName" => "Trail Merchant",
                         "advertiserCountry" => "US",
                         "sourceFeedType" => "SHOPPING",
                         "currency" => "USD",
                         "language" => "EN",
                         "feedName" => "Trail Shopping",
                         "productCount" => 10,
                         "providerLastUpdatedAt" => "2026-06-04T20:00:00.000000Z",
                         "lastSeenAt" => "2026-06-04T20:00:00.000000Z",
                         "reviewStatus" => "PENDING",
                         "reviewNote" => nil,
                         "reviewedAt" => nil
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => true,
                     "hasPreviousPage" => false
                   }
                 }
               }
             } = graphql(conn, merchant_feed_candidates_query(), %{"first" => 1})

      assert first_id == relay_id(:merchant_feed_candidate, first_candidate.id)

      assert %{
               "data" => %{
                 "merchantFeedCandidates" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => second_id,
                         "providerFeedId" => "feed-2",
                         "advertiserName" => "Urban Merchant"
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } =
               graphql(conn, merchant_feed_candidates_query(), %{
                 "first" => 10,
                 "after" => first_cursor
               })

      assert second_id == relay_id(:merchant_feed_candidate, second_candidate.id)
    end

    test "merchantFeedCandidate does not expose raw metadata fields", %{conn: conn} do
      assert %{
               "data" => %{
                 "__type" => %{
                   "fields" => fields
                 }
               }
             } = graphql(conn, merchant_feed_candidate_introspection_query(), %{})

      refute Enum.any?(fields, fn %{"name" => name} -> name in ["rawMetadata", "raw_metadata"] end)
    end

    test "merchantFeedCandidates rejects invalid cursors", %{conn: conn} do
      assert %{
               "data" => %{"merchantFeedCandidates" => nil},
               "errors" => [
                 %{"message" => "invalid cursor", "path" => ["merchantFeedCandidates"]} | _
               ]
             } =
               graphql(conn, merchant_feed_candidates_query(), %{
                 "first" => 1,
                 "after" => "bad-cursor"
               })
    end

    test "reviewMerchantFeedCandidate updates candidate review status", %{conn: conn} do
      source = source_fixture()

      {:ok, candidate} =
        Ingestion.upsert_merchant_feed_candidate(source, %{
          advertiser_name: "Trail Merchant",
          last_seen_at: ~U[2026-06-04 20:00:00Z],
          provider: "cj",
          provider_feed_id: "feed-1"
        })

      assert %{
               "data" => %{
                 "reviewMerchantFeedCandidate" => %{
                   "candidate" => %{
                     "id" => candidate_id,
                     "reviewStatus" => "SHORTLISTED",
                     "reviewNote" => "Good fit",
                     "reviewedAt" => reviewed_at
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(conn, review_merchant_feed_candidate_mutation(), %{
                 "input" => %{
                   "id" => relay_id(:merchant_feed_candidate, candidate.id),
                   "status" => "SHORTLISTED",
                   "note" => "Good fit"
                 }
               })

      assert candidate_id == relay_id(:merchant_feed_candidate, candidate.id)
      assert is_binary(reviewed_at)
    end

    test "reviewMerchantFeedCandidate returns payload errors for invalid ids", %{conn: conn} do
      assert %{
               "data" => %{
                 "reviewMerchantFeedCandidate" => %{
                   "candidate" => nil,
                   "errors" => [
                     %{
                       "code" => "INVALID_ID",
                       "field" => "id",
                       "message" => "invalid candidate id"
                     }
                   ]
                 }
               }
             } =
               graphql(conn, review_merchant_feed_candidate_mutation(), %{
                 "input" => %{
                   "id" => relay_id(:product, 123),
                   "status" => "DISMISSED"
                 }
               })
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
          domain: "cj.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp merchant_feed_candidates_query do
    """
    query MerchantFeedCandidates($first: Int, $after: String) {
      merchantFeedCandidates(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            provider
            providerFeedId
            advertiserName
            advertiserCountry
            sourceFeedType
            currency
            language
            feedName
            productCount
            providerLastUpdatedAt
            lastSeenAt
            reviewStatus
            reviewNote
            reviewedAt
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
        }
      }
    }
    """
  end

  defp review_merchant_feed_candidate_mutation do
    """
    mutation ReviewMerchantFeedCandidate($input: ReviewMerchantFeedCandidateInput!) {
      reviewMerchantFeedCandidate(input: $input) {
        candidate {
          id
          reviewStatus
          reviewNote
          reviewedAt
        }
        errors {
          code
          field
          message
        }
      }
    }
    """
  end

  defp merchant_feed_candidate_introspection_query do
    """
    query MerchantFeedCandidateFields {
      __type(name: "MerchantFeedCandidate") {
        fields {
          name
        }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
