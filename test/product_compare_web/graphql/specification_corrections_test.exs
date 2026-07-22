defmodule ProductCompareWeb.GraphQL.SpecificationCorrectionsTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Specs.SpecificationCorrection

  describe "specification correction GraphQL workflow" do
    test "moderation queue rejects non-operators before reading corrections", %{conn: conn} do
      {anonymous_response, anonymous_queries} =
        capture_select_queries(fn -> graphql(conn, moderation_queue_query(), %{}) end)

      assert %{
               "errors" => [
                 %{
                   "message" => "unauthorized",
                   "path" => ["specificationCorrectionModerationQueue"],
                   "extensions" => %{"code" => "UNAUTHENTICATED"}
                 }
               ]
             } = anonymous_response

      member_conn = member_conn(conn)

      {forbidden_response, forbidden_queries} =
        capture_select_queries(fn -> graphql(member_conn, moderation_queue_query(), %{}) end)

      assert %{
               "errors" => [
                 %{
                   "message" => "forbidden",
                   "path" => ["specificationCorrectionModerationQueue"],
                   "extensions" => %{"code" => "FORBIDDEN"}
                 }
               ]
             } = forbidden_response

      assert correction_select_count(anonymous_queries) == 0
      assert correction_select_count(forbidden_queries) == 0
    end

    test "requires authentication and validates typed IDs without writing", %{conn: conn} do
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})

      variables = correction_variables(product, attribute, "OLED")

      assert %{
               "data" => %{
                 "proposeSpecificationCorrection" => %{
                   "correction" => nil,
                   "errors" => [%{"code" => "UNAUTHENTICATED"}]
                 }
               }
             } = graphql(conn, propose_mutation(), variables)

      authed_conn = member_conn(conn)

      assert %{
               "data" => %{
                 "proposeSpecificationCorrection" => %{
                   "correction" => nil,
                   "errors" => [%{"code" => "INVALID_ID", "field" => "productId"}]
                 }
               }
             } =
               graphql(
                 authed_conn,
                 propose_mutation(),
                 put_in(variables, ["input", "productId"], product.id)
               )

      assert Repo.aggregate(SpecificationCorrection, :count, :id) == 0
    end

    test "creates an owner-readable pending proposal and exposes only public aggregates", %{
      conn: conn
    } do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      put_current!(product, attribute, "LCD")
      authed_conn = log_in_user(conn, user) |> put_req_header_same_origin()

      assert %{
               "data" => %{
                 "proposeSpecificationCorrection" => %{
                   "correction" => %{
                     "id" => correction_id,
                     "status" => "PENDING",
                     "reason" => "The manufacturer specification lists OLED.",
                     "sourceUrl" => "https://manufacturer.example/model/specifications",
                     "valueText" => "OLED",
                     "moderationNote" => nil
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(
                 authed_conn,
                 propose_mutation(),
                 correction_variables(product, attribute, "OLED")
               )

      assert %{
               "data" => %{
                 "mySpecificationCorrections" => %{
                   "edges" => [%{"node" => %{"id" => ^correction_id, "valueText" => "OLED"}}]
                 }
               }
             } = graphql(authed_conn, my_corrections_query(), %{})

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => [
                     %{
                       "valueText" => "LCD",
                       "pendingCorrectionCount" => 1,
                       "acceptedCorrectionCount" => 0
                     }
                   ]
                 }
               }
             } = graphql(conn, product_correction_state_query(), %{"slug" => product.slug})
    end

    test "keeps owner and operator scopes separate and moderates atomically", %{conn: conn} do
      owner = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      product = SpecsFixtures.product_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      put_current!(product, attribute, "LCD")

      owner_conn = log_in_user(conn, owner) |> put_req_header_same_origin()
      other_conn = log_in_user(conn, other_user) |> put_req_header_same_origin()
      operator_conn = log_in_user(conn, operator) |> put_req_header_same_origin()

      %{
        "data" => %{
          "proposeSpecificationCorrection" => %{
            "correction" => %{"id" => correction_id},
            "errors" => []
          }
        }
      } =
        graphql(
          owner_conn,
          propose_mutation(),
          correction_variables(product, attribute, "OLED")
        )

      assert %{"data" => %{"mySpecificationCorrections" => %{"edges" => []}}} =
               graphql(other_conn, my_corrections_query(), %{})

      assert %{"errors" => [%{"extensions" => %{"code" => "FORBIDDEN"}}]} =
               graphql(other_conn, moderation_queue_query(), %{})

      assert %{
               "data" => %{
                 "moderateSpecificationCorrection" => %{
                   "correction" => nil,
                   "errors" => [%{"code" => "FORBIDDEN"}]
                 }
               }
             } = graphql(other_conn, moderate_mutation(), moderation_variables(correction_id))

      assert %{
               "data" => %{
                 "specificationCorrectionModerationQueue" => %{
                   "edges" => [%{"node" => %{"id" => ^correction_id, "status" => "PENDING"}}]
                 }
               }
             } = graphql(operator_conn, moderation_queue_query(), %{})

      assert %{
               "data" => %{
                 "moderateSpecificationCorrection" => %{
                   "correction" => %{
                     "id" => ^correction_id,
                     "status" => "ACCEPTED",
                     "moderationNote" => "Confirmed against source."
                   },
                   "errors" => []
                 }
               }
             } =
               graphql(operator_conn, moderate_mutation(), moderation_variables(correction_id))

      assert %{
               "data" => %{
                 "mySpecificationCorrections" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "status" => "ACCEPTED",
                         "moderationNote" => nil
                       }
                     }
                   ]
                 }
               }
             } = graphql(owner_conn, my_corrections_query(), %{})

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => [
                     %{
                       "valueText" => "OLED",
                       "pendingCorrectionCount" => 0,
                       "acceptedCorrectionCount" => 1
                     }
                   ]
                 }
               }
             } = graphql(conn, product_correction_state_query(), %{"slug" => product.slug})
    end
  end

  defp correction_variables(product, attribute, value) do
    %{
      "input" => %{
        "productId" => relay_id(:product, product.id),
        "attributeId" => relay_id(:attribute, attribute.id),
        "value" => %{"valueText" => value},
        "reason" => "The manufacturer specification lists OLED.",
        "sourceUrl" => "https://manufacturer.example/model/specifications"
      }
    }
  end

  defp moderation_variables(correction_id) do
    %{
      "input" => %{
        "id" => correction_id,
        "decision" => "ACCEPTED",
        "moderationNote" => "Confirmed against source."
      }
    }
  end

  defp put_current!(product, attribute, value) do
    operator = AccountsFixtures.operator_fixture()

    {:ok, claim} =
      Specs.propose_claim(product.id, attribute.id, %{value_text: value}, %{
        source_type: :user,
        created_by: operator.id
      })

    {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
    {:ok, _current} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp correction_select_count(queries) do
    Enum.count(queries, &String.contains?(&1, ~s(FROM "specification_corrections")))
  end

  defp propose_mutation do
    """
    mutation ProposeSpecificationCorrection($input: ProposeSpecificationCorrectionInput!) {
      proposeSpecificationCorrection(input: $input) {
        correction {
          id
          status
          reason
          sourceUrl
          valueText
          moderationNote
        }
        errors { code field message }
      }
    }
    """
  end

  defp moderate_mutation do
    """
    mutation ModerateSpecificationCorrection($input: ModerateSpecificationCorrectionInput!) {
      moderateSpecificationCorrection(input: $input) {
        correction { id status moderationNote }
        errors { code field message }
      }
    }
    """
  end

  defp my_corrections_query do
    """
    query MySpecificationCorrections {
      mySpecificationCorrections(first: 20) {
        edges { node { id status valueText moderationNote } }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
  end

  defp moderation_queue_query do
    """
    query SpecificationCorrectionModerationQueue {
      specificationCorrectionModerationQueue(first: 20, status: PENDING) {
        edges { node { id status valueText moderationNote } }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
  end

  defp product_correction_state_query do
    """
    query ProductCorrectionState($slug: String!) {
      product(slug: $slug) {
        currentAttributes {
          valueText
          pendingCorrectionCount
          acceptedCorrectionCount
        }
      }
    }
    """
  end
end
