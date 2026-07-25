defmodule ProductCompareWeb.GraphQL.CJProgramQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  describe "/api/graphql CJ program lifecycle" do
    test "cjPrograms has stable stage-filtered pagination while stage counts remain global", %{
      conn: conn
    } do
      source = source_fixture()

      alpha =
        program_fixture(
          source,
          "alpha",
          "Alpha Merchant",
          "selected",
          ~U[2026-07-20 10:00:00.000000Z]
        )

      beta =
        program_fixture(
          source,
          "beta",
          nil,
          "selected",
          ~U[2026-07-20 11:00:00.000000Z],
          advertiser_country: nil,
          currency: nil,
          language: nil,
          product_count: nil
        )

      _applied =
        program_fixture(
          source,
          "applied",
          "Applied Merchant",
          "applied",
          ~U[2026-07-20 12:00:00.000000Z]
        )

      _declined =
        program_fixture(
          source,
          "declined",
          "Declined Merchant",
          "declined",
          ~U[2026-07-20 13:00:00.000000Z]
        )

      conn = operator_conn(conn)

      assert %{
               "data" => %{
                 "cjProgramStageCounts" => %{
                   "new" => 0,
                   "considering" => 0,
                   "selected" => 2,
                   "applied" => 1,
                   "accepted" => 0,
                   "notPursuing" => 0,
                   "declined" => 1
                 },
                 "cjPrograms" => %{
                   "edges" => [
                     %{
                       "cursor" => cursor,
                       "node" => %{
                         "id" => alpha_id,
                         "advertiserId" => "alpha",
                         "advertiserName" => "Alpha Merchant",
                         "stage" => "SELECTED",
                         "note" => nil,
                         "lastChanged" => "2026-07-20T10:00:00.000000Z",
                         "feedCount" => 1,
                         "warningCodes" => []
                       }
                     }
                   ],
                   "pageInfo" => %{"hasNextPage" => true}
                 }
               }
             } = graphql(conn, cj_programs_query(), %{"first" => 1, "stage" => "SELECTED"})

      assert alpha_id == relay_id(:cj_program, alpha.entropy_id)

      assert %{
               "data" => %{
                 "cjPrograms" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => beta_id,
                         "advertiserId" => "beta",
                         "advertiserName" => "beta",
                         "warningCodes" => [
                           "MISSING_ADVERTISER_NAME",
                           "MISSING_PRODUCT_COUNT",
                           "NON_US_MARKET",
                           "NON_USD_CURRENCY",
                           "NON_ENGLISH_LANGUAGE"
                         ]
                       }
                     }
                   ],
                   "pageInfo" => %{"hasNextPage" => false}
                 }
               }
             } =
               graphql(conn, cj_programs_query(), %{
                 "first" => 1,
                 "after" => cursor,
                 "stage" => "SELECTED"
               })

      assert beta_id == relay_id(:cj_program, beta.entropy_id)
    end

    test "cjPrograms supports each deterministic sort", %{conn: conn} do
      source = source_fixture()

      alpha =
        program_fixture(source, "alpha", "Alpha Merchant", "new", ~U[2026-07-20 10:00:00.000000Z])

      _alpha_second_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: alpha.advertiser_id,
          advertiser_name: "Alpha Merchant",
          last_seen_at: ~U[2026-07-20 10:01:00.000000Z],
          provider_feed_id: "alpha-second"
        })

      charlie =
        program_fixture(
          source,
          "charlie",
          "Charlie Merchant",
          "new",
          ~U[2026-07-20 12:00:00.000000Z]
        )

      bravo =
        program_fixture(source, "bravo", "Bravo Merchant", "new", ~U[2026-07-20 11:00:00.000000Z])

      conn = operator_conn(conn)

      assert program_names(conn, "NAME_ASC") == [
               "Alpha Merchant",
               "Bravo Merchant",
               "Charlie Merchant"
             ]

      assert program_names(conn, "LAST_CHANGED_DESC") == [
               "Charlie Merchant",
               "Bravo Merchant",
               "Alpha Merchant"
             ]

      assert program_names(conn, "FEED_COUNT_DESC") == [
               "Alpha Merchant",
               "Charlie Merchant",
               "Bravo Merchant"
             ]

      assert %{"data" => %{"cjProgram" => %{"id" => charlie_id}}} =
               graphql(conn, cj_program_query(), %{
                 "id" => relay_id(:cj_program, charlie.entropy_id)
               })

      assert charlie_id == relay_id(:cj_program, charlie.entropy_id)
      assert alpha.entropy_id != bravo.entropy_id
    end

    test "cjProgram feeds and unmatchedCjFeeds expose bounded safe feed facts", %{conn: conn} do
      source = source_fixture()

      program =
        program_fixture(
          source,
          "feed-owner",
          "Feed Owner",
          "considering",
          ~U[2026-07-20 10:00:00.000000Z],
          last_seen_at: ~U[2026-07-20 09:00:00.000000Z],
          provider_feed_id: "older-feed"
        )

      newest_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: "feed-owner",
          advertiser_name: "Feed Owner",
          last_seen_at: ~U[2026-07-20 11:00:00.000000Z],
          provider_feed_id: "newer-feed",
          product_count: 11
        })

      unmatched_feed =
        merchant_feed_candidate_fixture(source, %{
          advertiser_id: nil,
          advertiser_name: "Unmatched Merchant",
          last_seen_at: ~U[2026-07-20 12:00:00.000000Z],
          provider_feed_id: "unmatched-feed"
        })

      conn = operator_conn(conn)

      assert %{
               "data" => %{
                 "cjProgram" => %{
                   "feeds" => %{
                     "edges" => [
                       %{
                         "node" => %{
                           "id" => newest_feed_id,
                           "provider" => "cj",
                           "providerFeedId" => "newer-feed",
                           "advertiserName" => "Feed Owner",
                           "productCount" => 11
                         }
                       }
                     ],
                     "pageInfo" => %{"hasNextPage" => true}
                   }
                 },
                 "unmatchedCjFeeds" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => unmatched_feed_id,
                         "providerFeedId" => "unmatched-feed",
                         "advertiserName" => "Unmatched Merchant"
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, cj_program_and_unmatched_query(), %{
                 "id" => relay_id(:cj_program, program.entropy_id)
               })

      assert newest_feed_id == relay_id(:merchant_feed_candidate, newest_feed.id)
      assert unmatched_feed_id == relay_id(:merchant_feed_candidate, unmatched_feed.id)
    end

    test "updateCjProgram directly accepts every stage and normalizes blank notes", %{conn: conn} do
      source = source_fixture()

      program =
        program_fixture(
          source,
          "lifecycle",
          "Lifecycle Merchant",
          "new",
          ~U[2026-07-20 10:00:00.000000Z]
        )

      conn = operator_conn(conn)
      program_id = relay_id(:cj_program, program.entropy_id)

      for {stage, index} <-
            Enum.with_index(
              ~w(NEW CONSIDERING SELECTED APPLIED ACCEPTED NOT_PURSUING DECLINED),
              1
            ) do
        note = if stage == "DECLINED", do: "   ", else: "note #{index}"

        assert %{
                 "data" => %{
                   "updateCjProgram" => %{
                     "program" => %{
                       "id" => ^program_id,
                       "stage" => ^stage,
                       "note" => returned_note
                     },
                     "errors" => []
                   }
                 }
               } =
                 graphql(conn, update_cj_program_mutation(), %{
                   "input" => %{"id" => program_id, "stage" => stage, "note" => note}
                 })

        assert returned_note == if(stage == "DECLINED", do: nil, else: note)
      end

      assert %CJProgram{stage: "declined", note: nil} = Repo.get!(CJProgram, program.id)
    end

    test "updateCjProgram returns typed errors for malformed, wrong-type, and missing program IDs",
         %{
           conn: conn
         } do
      conn = operator_conn(conn)

      assert_mutation_error(conn, "not-a-global-id", "INVALID_ID", "invalid program id", "id")

      assert_mutation_error(
        conn,
        relay_id(:product, 123),
        "INVALID_ID",
        "invalid program id",
        "id"
      )

      assert_mutation_error(
        conn,
        relay_id(:cj_program, Ecto.UUID.generate()),
        "NOT_FOUND",
        "program not found",
        nil
      )
    end

    test "CJ program operations authorize before reading or writing lifecycle tables", %{
      conn: conn
    } do
      source = source_fixture()

      program =
        program_fixture(
          source,
          "operator-only",
          "Operator Only",
          "new",
          ~U[2026-07-20 10:00:00.000000Z]
        )

      variables = %{"id" => relay_id(:cj_program, program.entropy_id)}

      for unauthorized_conn <- [conn, member_conn(conn)] do
        {response, queries} =
          capture_select_queries(fn ->
            graphql(unauthorized_conn, operator_only_query(), variables)
          end)

        assert %{"errors" => [_ | _]} = response
        assert count_select_queries_targeting_table(queries, :cj_programs) == 0
        assert count_select_queries_targeting_table(queries, :merchant_feed_candidates) == 0
      end

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, update_cj_program_mutation(), %{
            "input" => %{"id" => variables["id"], "stage" => "DECLINED", "note" => "nope"}
          })
        end)

      assert %{
               "data" => %{
                 "updateCjProgram" => %{
                   "program" => nil,
                   "errors" => [%{"code" => "UNAUTHENTICATED"}]
                 }
               }
             } = response

      assert count_select_queries_targeting_table(queries, :cj_programs) == 0
      assert count_select_queries_targeting_table(queries, :merchant_feed_candidates) == 0
      assert %CJProgram{stage: "new"} = Repo.get!(CJProgram, program.id)
    end

    test "CJ program schema omits secrets and retired feed-review operations", %{conn: conn} do
      assert %{
               "data" => %{
                 "program" => %{"fields" => program_fields},
                 "feed" => %{"fields" => feed_fields},
                 "query" => %{"fields" => query_fields},
                 "mutation" => %{"fields" => mutation_fields}
               }
             } = graphql(conn, cj_program_introspection_query(), %{})

      fields = Enum.map(program_fields ++ feed_fields, & &1["name"])
      operations = Enum.map(query_fields ++ mutation_fields, & &1["name"])

      refute Enum.any?(
               fields,
               &(&1 in ~w(rawMetadata credentials accountId trackingParams providerPayload fitScore))
             )

      refute Enum.any?(fields, &(&1 in ~w(reviewStatus reviewNote reviewedAt)))

      refute Enum.any?(
               operations,
               &(&1 in ~w(reviewMerchantFeedCandidate merchantFeedCandidates))
             )
    end
  end

  defp program_fixture(source, advertiser_id, advertiser_name, stage, changed_at, attrs \\ []) do
    feed =
      merchant_feed_candidate_fixture(
        source,
        Map.merge(
          %{
            advertiser_id: advertiser_id,
            advertiser_name: advertiser_name,
            provider_feed_id: "#{advertiser_id}-#{System.unique_integer([:positive])}"
          },
          Map.new(attrs)
        )
      )

    program = Repo.get!(CJProgram, feed.cj_program_id)

    lifecycle_attrs =
      if stage == "new" do
        %{stage: stage, note: "fixture lifecycle timestamp"}
      else
        %{stage: stage}
      end

    assert {:ok, program} =
             Ingestion.update_cj_program_lifecycle(
               program.entropy_id,
               lifecycle_attrs,
               changed_at
             )

    program
  end

  defp program_names(conn, sort) do
    assert %{"data" => %{"cjPrograms" => %{"edges" => edges}}} =
             graphql(conn, cj_program_sort_query(), %{"sort" => sort})

    Enum.map(edges, &get_in(&1, ["node", "advertiserName"]))
  end

  defp assert_mutation_error(conn, id, code, message, field) do
    assert %{
             "data" => %{
               "updateCjProgram" => %{
                 "program" => nil,
                 "errors" => [%{"code" => ^code, "message" => ^message, "field" => ^field}]
               }
             }
           } =
             graphql(conn, update_cj_program_mutation(), %{
               "input" => %{"id" => id, "stage" => "SELECTED"}
             })
  end

  defp cj_programs_query do
    """
    query CJPrograms($first: Int!, $after: String, $stage: CJProgramStage) {
      cjProgramStageCounts {
        new considering selected applied accepted notPursuing declined
      }
      cjPrograms(first: $first, after: $after, stage: $stage, sort: NAME_ASC) {
        edges {
          cursor
          node {
            id advertiserId advertiserName stage note lastChanged feedCount warningCodes
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
  end

  defp cj_program_sort_query do
    """
    query CJProgramSort($sort: CJProgramSort!) {
      cjPrograms(first: 10, sort: $sort) {
        edges { node { advertiserName } }
      }
    }
    """
  end

  defp cj_program_query do
    """
    query CJProgram($id: ID!) {
      cjProgram(id: $id) { id }
    }
    """
  end

  defp cj_program_and_unmatched_query do
    """
    query CJProgramFeeds($id: ID!) {
      cjProgram(id: $id) {
        feeds(first: 1) {
          edges { node { id provider providerFeedId advertiserName productCount } }
          pageInfo { hasNextPage }
        }
      }
      unmatchedCjFeeds(first: 1) {
        edges { node { id providerFeedId advertiserName } }
      }
    }
    """
  end

  defp update_cj_program_mutation do
    """
    mutation UpdateCjProgram($input: UpdateCjProgramInput!) {
      updateCjProgram(input: $input) {
        program { id stage note }
        errors { code message field }
      }
    }
    """
  end

  defp operator_only_query do
    """
    query OperatorOnly($id: ID!) {
      cjPrograms(first: 1) { edges { node { id } } }
      cjProgram(id: $id) { id }
      cjProgramStageCounts { new }
      unmatchedCjFeeds(first: 1) { edges { node { id } } }
    }
    """
  end

  defp cj_program_introspection_query do
    """
    query CJProgramIntrospection {
      program: __type(name: "CJProgram") { fields { name } }
      feed: __type(name: "MerchantFeedCandidate") { fields { name } }
      query: __type(name: "RootQueryType") { fields { name } }
      mutation: __type(name: "RootMutationType") { fields { name } }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end
end
