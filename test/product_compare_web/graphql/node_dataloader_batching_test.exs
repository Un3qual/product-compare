defmodule ProductCompareWeb.GraphQL.NodeDataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  import Ecto.Query

  alias ProductCompare.Accounts
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.{AccountsFixtures, CJIngestionFixtures, SpecsFixtures}
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  test "community node aliases stay set-based as each content type grows", %{conn: conn} do
    records = community_records(1..4)

    assert_alias_budget_is_stable(
      conn,
      records,
      [:product_reviews, :product_threads, :thread_posts]
    )
  end

  test "owner node aliases stay set-based as the selection grows", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    records = snapshot_records(owner, 1..4)
    conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    assert_alias_budget_is_stable(
      conn,
      records,
      [:comparison_snapshots, :comparison_snapshot_products]
    )
  end

  test "operator node aliases stay set-based as ingestion selections grow", %{conn: conn} do
    source = CJIngestionFixtures.source_fixture()

    candidates =
      Enum.map(1..4, fn index ->
        CJIngestionFixtures.merchant_feed_candidate_fixture(source, %{
          advertiser_id: "node-batch-advertiser-#{index}",
          provider_feed_id: "node-batch-feed-#{index}"
        })
      end)

    program_ids = Enum.map(candidates, & &1.cj_program_id)

    programs =
      CJProgram
      |> where([program], program.id in ^program_ids)
      |> Repo.all()
      |> Map.new(&{&1.id, &1})

    records =
      candidates
      |> Enum.flat_map(fn candidate ->
        program = Map.fetch!(programs, candidate.cj_program_id)

        [
          {:cj_program, program.entropy_id},
          {:merchant_feed_candidate, candidate.id}
        ]
      end)

    conn = operator_conn(conn)

    assert_alias_budget_is_stable(
      conn,
      records,
      [:cj_programs, :merchant_feed_candidates]
    )
  end

  test "CJ program node aliases batch enriched summaries and warnings as selections grow", %{
    conn: conn
  } do
    source = CJIngestionFixtures.source_fixture()

    candidates =
      Enum.map(1..4, fn index ->
        advertiser_name = "Node batch merchant #{index}"

        candidate =
          CJIngestionFixtures.merchant_feed_candidate_fixture(source, %{
            advertiser_id: "node-summary-advertiser-#{index}",
            advertiser_name: advertiser_name,
            product_count: nil,
            provider_feed_id: "node-summary-feed-#{index}"
          })

        %{candidate: candidate, advertiser_name: advertiser_name}
      end)

    program_ids = Enum.map(candidates, & &1.candidate.cj_program_id)

    programs =
      CJProgram
      |> where([program], program.id in ^program_ids)
      |> Repo.all()
      |> Map.new(&{&1.id, &1})

    records =
      Enum.map(candidates, fn %{candidate: candidate, advertiser_name: advertiser_name} ->
        program = Map.fetch!(programs, candidate.cj_program_id)

        %{
          entropy_id: program.entropy_id,
          advertiser_name: advertiser_name,
          feed_count: 1,
          warning_codes: ["MISSING_PRODUCT_COUNT"]
        }
      end)

    conn = operator_conn(conn)
    initial_records = Enum.take(records, 2)

    {initial_response, initial_queries} =
      capture_select_queries(fn -> graphql(conn, cj_program_alias_query(initial_records)) end)

    {grown_response, grown_queries} =
      capture_select_queries(fn -> graphql(conn, cj_program_alias_query(records)) end)

    assert_cj_program_aliases(initial_response, initial_records)
    assert_cj_program_aliases(grown_response, records)

    initial_budget = query_budget(initial_queries, [:cj_programs, :merchant_feed_candidates])
    grown_budget = query_budget(grown_queries, [:cj_programs, :merchant_feed_candidates])

    assert initial_budget == grown_budget
    assert initial_budget == %{cj_programs: 1, merchant_feed_candidates: 2}
  end

  test "self node aliases never batch-read another user", %{conn: conn} do
    user = AccountsFixtures.user_fixture() |> then(&Accounts.get_user!(&1.id))
    other_user = AccountsFixtures.user_fixture() |> then(&Accounts.get_user!(&1.id))
    conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    {response, queries} =
      capture_select_queries(fn ->
        graphql(
          conn,
          node_alias_query([
            {:user, user.entropy_id},
            {:user, other_user.entropy_id}
          ])
        )
      end)

    assert %{
             "data" => %{
               "node1" => %{"__typename" => "User"},
               "node2" => nil
             }
           } = response

    assert count_select_queries_targeting_table(queries, :users) == 1
  end

  defp assert_alias_budget_is_stable(conn, records, tables) do
    initial_records = Enum.take(records, div(length(records), 2))

    {initial_response, initial_queries} =
      capture_select_queries(fn -> graphql(conn, node_alias_query(initial_records)) end)

    {grown_response, grown_queries} =
      capture_select_queries(fn -> graphql(conn, node_alias_query(records)) end)

    assert_node_aliases(initial_response, length(initial_records))
    assert_node_aliases(grown_response, length(records))

    initial_budget = query_budget(initial_queries, tables)
    grown_budget = query_budget(grown_queries, tables)

    assert initial_budget == grown_budget
    assert Enum.all?(initial_budget, fn {_table, count} -> count > 0 end)
  end

  defp community_records(indexes) do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()

    indexes
    |> Enum.flat_map(fn index ->
      product = SpecsFixtures.product_fixture()

      {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 5})

      {:ok, question} =
        Discussions.ask_question(owner.id, product.id, %{title: "Node batch question #{index}"})

      {:ok, _question} =
        Discussions.moderate(operator.id, :question, question.entropy_id, :published)

      {:ok, answer} =
        Discussions.answer_question(owner.id, question.entropy_id, "Node batch answer #{index}")

      {:ok, _review} =
        Discussions.moderate(operator.id, :review, review.entropy_id, :published)

      {:ok, _answer} =
        Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

      [
        {:product_review, review.entropy_id},
        {:product_question, question.entropy_id},
        {:product_answer, answer.entropy_id}
      ]
    end)
  end

  defp snapshot_records(owner, indexes) do
    Enum.map(indexes, fn index ->
      first = SpecsFixtures.product_fixture()
      second = SpecsFixtures.product_fixture()

      {:ok, snapshot} =
        ComparisonSnapshots.publish(owner.id, %{
          title: "Node batch snapshot #{index}",
          product_ids: [first.id, second.id],
          recommendation_profile: :lowest_current_cost
        })

      {:comparison_snapshot, snapshot.entropy_id}
    end)
  end

  defp node_alias_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.map_join("\n", fn {{type, local_id}, index} ->
        """
        node#{index}: node(id: "#{relay_id(type, local_id)}") {
          __typename
          id
        }
        """
      end)

    """
    query NodeAliases {
      #{selections}
    }
    """
  end

  defp cj_program_alias_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.map_join("\n", fn {record, index} ->
        """
        program#{index}: node(id: "#{relay_id(:cj_program, record.entropy_id)}") {
          ... on CJProgram {
            advertiserName
            feedCount
            warningCodes
          }
        }
        """
      end)

    """
    query CJProgramNodeAliases {
      #{selections}
    }
    """
  end

  defp assert_cj_program_aliases(%{"data" => data}, records) do
    records
    |> Enum.with_index(1)
    |> Enum.each(fn {record, index} ->
      assert data["program#{index}"] == %{
               "advertiserName" => record.advertiser_name,
               "feedCount" => record.feed_count,
               "warningCodes" => record.warning_codes
             }
    end)
  end

  defp assert_node_aliases(%{"data" => data}, expected_count) do
    assert map_size(data) == expected_count
    assert Enum.all?(data, fn {_alias, value} -> is_map(value) end)
  end

  defp query_budget(queries, tables) do
    Map.new(tables, &{&1, count_select_queries_targeting_table(queries, &1)})
  end

  defp graphql(conn, query) do
    conn
    |> post("/api/graphql", %{query: query, variables: %{}})
    |> json_response(200)
  end
end
