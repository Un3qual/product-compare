defmodule ProductCompareWeb.GraphQL.SpecificationCorrectionsTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_blocked_by: 2,
      capture_select_queries: 1,
      count_select_queries_targeting_table: 2,
      hold_operator_revocation: 1,
      hold_row_lock: 3,
      release_operator_revocation: 1,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Accounts
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareWeb.Resolvers.Specs.Reads
  alias ProductCompareWeb.Resolvers.Specs.Corrections, as: CorrectionResolver
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Taxonomy.Taxon

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

      assert count_select_queries_targeting_table(anonymous_queries, :specification_corrections) ==
               0

      assert count_select_queries_targeting_table(
               forbidden_queries,
               :specification_corrections
             ) == 0
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

    test "moderation rejects a stale operator snapshot without changing the correction" do
      submitter = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      correction = propose_correction!(submitter, attribute, "Stale correction")
      resolution = %{context: %{current_user: operator}}

      assert {:ok, %User{is_operator: false}} = Accounts.set_operator_access(operator, false)

      assert {:ok,
              %{
                correction: nil,
                errors: [%{code: "FORBIDDEN", message: "forbidden", field: nil}]
              }} =
               CorrectionResolver.moderate(
                 nil,
                 %{
                   input: %{
                     id: relay_id(:specification_correction, correction.id),
                     decision: :rejected,
                     moderation_note: "Must not be written"
                   }
                 },
                 resolution
               )

      assert %SpecificationCorrection{status: :pending, reviewed_by: nil} =
               Repo.get!(SpecificationCorrection, correction.id)

      assert %ProductAttributeClaim{status: :proposed} =
               Repo.get!(ProductAttributeClaim, correction.claim_id)
    end

    test "correction moderation waits for revocation and rejects the revoked operator" do
      fixture = committed_correction_fixture()
      on_exit(fn -> delete_committed_correction_fixture(fixture) end)

      {revocation, revocation_backend_pid} = hold_operator_revocation(fixture.operator.id)

      {moderation, moderation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(
            api_token_conn(fixture.token),
            moderate_mutation(),
            rejection_variables(fixture.correction.id)
          )
        end)

      assert_blocked_by(moderation_backend_pid, revocation_backend_pid)
      release_operator_revocation(revocation)

      assert %{
               "data" => %{
                 "moderateSpecificationCorrection" => %{
                   "correction" => nil,
                   "errors" => [%{"code" => "FORBIDDEN"}]
                 }
               }
             } = Task.await(moderation)

      assert %SpecificationCorrection{status: :pending, reviewed_by: nil} =
               Repo.get!(SpecificationCorrection, fixture.correction.id)

      assert %ProductAttributeClaim{status: :proposed} =
               Repo.get!(ProductAttributeClaim, fixture.correction.claim_id)
    end

    test "correction moderation holds operator access while waiting for its correction row" do
      fixture = committed_correction_fixture()
      on_exit(fn -> delete_committed_correction_fixture(fixture) end)

      {domain_barrier, domain_backend_pid} =
        hold_row_lock(SpecificationCorrection, fixture.correction.id, & &1)

      {moderation, moderation_backend_pid} =
        start_unboxed_action(fn ->
          graphql(
            api_token_conn(fixture.token),
            moderate_mutation(),
            rejection_variables(fixture.correction.id)
          )
        end)

      assert_blocked_by(moderation_backend_pid, domain_backend_pid)

      {revocation, revocation_backend_pid} =
        start_unboxed_action(fn ->
          User
          |> Repo.get!(fixture.operator.id)
          |> Accounts.set_operator_access(false)
        end)

      assert_blocked_by(revocation_backend_pid, moderation_backend_pid)
      release_row_lock(domain_barrier)

      assert %{
               "data" => %{
                 "moderateSpecificationCorrection" => %{
                   "correction" => %{"status" => "REJECTED"},
                   "errors" => []
                 }
               }
             } = Task.await(moderation)

      assert {:ok, %User{is_operator: false}} = Task.await(revocation)

      assert %SpecificationCorrection{status: :rejected, reviewed_by: reviewer_id} =
               Repo.get!(SpecificationCorrection, fixture.correction.id)

      assert reviewer_id == fixture.operator.id

      assert %ProductAttributeClaim{status: :rejected} =
               Repo.get!(ProductAttributeClaim, fixture.correction.claim_id)
    end

    test "my_specification_corrections directly filters and paginates without a loader" do
      owner = AccountsFixtures.user_fixture()
      other_user = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      first_pending = propose_correction!(owner, attribute, "First pending")
      second_pending = propose_correction!(owner, attribute, "Second pending")
      rejected = propose_correction!(owner, attribute, "Rejected")
      _other_pending = propose_correction!(other_user, attribute, "Other pending")

      assert {:ok, _rejected} =
               Specs.moderate_correction(rejected.id, operator.id, :rejected, %{})

      resolution = %{context: %{current_user: owner}}

      assert {:ok,
              %{
                edges: [%{cursor: cursor, node: first_node}],
                page_info: %{has_next_page: true, has_previous_page: false}
              }} =
               Reads.my_specification_corrections(
                 nil,
                 %{status: :pending, first: 1},
                 resolution
               )

      assert {:ok,
              %{
                edges: [%{node: second_node}],
                page_info: %{has_next_page: false, has_previous_page: true}
              }} =
               Reads.my_specification_corrections(
                 nil,
                 %{status: :pending, first: 1, after: cursor},
                 resolution
               )

      assert MapSet.new([first_node.id, second_node.id]) ==
               MapSet.new([first_pending.id, second_pending.id])

      refute rejected.id in [first_node.id, second_node.id]
    end

    test "specification_correction_moderation_queue directly filters and paginates without a loader" do
      submitter = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      first_pending = propose_correction!(submitter, attribute, "First pending")
      second_pending = propose_correction!(submitter, attribute, "Second pending")
      rejected = propose_correction!(submitter, attribute, "Rejected")

      assert {:ok, _rejected} =
               Specs.moderate_correction(rejected.id, operator.id, :rejected, %{})

      resolution = %{context: %{current_user: operator}}

      assert {:ok,
              %{
                edges: [%{cursor: cursor, node: first_node}],
                page_info: %{has_next_page: true, has_previous_page: false}
              }} =
               Reads.specification_correction_moderation_queue(
                 nil,
                 %{status: :pending, first: 1},
                 resolution
               )

      assert {:ok,
              %{
                edges: [%{node: second_node}],
                page_info: %{has_next_page: false, has_previous_page: true}
              }} =
               Reads.specification_correction_moderation_queue(
                 nil,
                 %{status: :pending, first: 1, after: cursor},
                 resolution
               )

      assert MapSet.new([first_node.id, second_node.id]) ==
               MapSet.new([first_pending.id, second_pending.id])

      refute rejected.id in [first_node.id, second_node.id]
    end
  end

  defp propose_correction!(user, attribute, value) do
    product = SpecsFixtures.product_fixture()

    assert {:ok, correction} =
             Specs.propose_correction(
               product.id,
               attribute.id,
               user.id,
               %{value_text: value},
               %{
                 reason: "Direct resolver fallback characterization",
                 explanation: "Characterizes the existing no-loader query path."
               }
             )

    correction
  end

  defp committed_correction_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      operator = AccountsFixtures.operator_fixture()
      submitter = AccountsFixtures.user_fixture()
      {:ok, %{plain_text_token: token}} = Accounts.create_api_token(operator.id, %{})
      attribute = SpecsFixtures.attribute_fixture(%{data_type: :text})
      correction = propose_correction!(submitter, attribute, "Concurrent correction")
      product = Repo.get!(Product, correction.product_id)

      %{
        attribute: attribute,
        brand_id: product.brand_id,
        correction: correction,
        operator: operator,
        product: product,
        submitter: submitter,
        taxon_id: product.primary_type_taxon_id,
        token: token
      }
    end)
  end

  defp delete_committed_correction_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete!(Repo.get!(SpecificationCorrection, fixture.correction.id))
      Repo.delete!(Repo.get!(ProductAttributeClaim, fixture.correction.claim_id))
      Repo.delete!(Repo.get!(Product, fixture.product.id))
      Repo.delete!(Repo.get!(Brand, fixture.brand_id))
      Repo.delete!(Repo.get!(Taxon, fixture.taxon_id))
      Repo.delete!(Repo.get!(Attribute, fixture.attribute.id))
      Repo.delete!(Repo.get!(User, fixture.submitter.id))
      Repo.delete!(Repo.get!(User, fixture.operator.id))
    end)
  end

  defp api_token_conn(token) do
    build_conn()
    |> put_req_header("authorization", "Bearer #{token}")
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

  defp rejection_variables(correction_id) do
    %{
      "input" => %{
        "id" => relay_id(:specification_correction, correction_id),
        "decision" => "REJECTED",
        "moderationNote" => "Rejected by deterministic concurrency test."
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
