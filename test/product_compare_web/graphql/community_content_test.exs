defmodule ProductCompareWeb.GraphQL.CommunityContentTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompareWeb.GraphQL.Connection

  setup do
    previous = Application.get_env(:product_compare, ProductCompare.Discussions)

    on_exit(fn ->
      if previous,
        do: Application.put_env(:product_compare, ProductCompare.Discussions, previous),
        else: Application.delete_env(:product_compare, ProductCompare.Discussions)
    end)

    :ok
  end

  test "pending reviews stay out of public ratings until operator publication", %{conn: conn} do
    user = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    member_conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    response =
      graphql(member_conn, submit_review_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "idempotencyKey" => "review-graphql-key-001",
          "rating" => 5,
          "title" => "Excellent",
          "body" => "Simple and reliable."
        }
      })

    assert %{
             "data" => %{
               "submitProductReview" => %{
                 "review" => %{
                   "id" => review_id,
                   "moderationStatus" => "PENDING",
                   "verifiedPurchase" => false
                 },
                 "errors" => []
               }
             }
           } = response

    assert get_in(graphql(conn, product_community_query(), %{"slug" => product.slug}), [
             "data",
             "product",
             "reviewSummary"
           ]) == %{"count" => 0, "averageRating" => nil}

    operator_conn = conn |> log_in_user(operator) |> put_req_header_same_origin()

    assert get_in(
             graphql(operator_conn, moderate_mutation(), %{
               "input" => %{
                 "contentType" => "REVIEW",
                 "contentId" => review_id,
                 "status" => "PUBLISHED"
               }
             }),
             ["data", "moderateCommunityContent", "errors"]
           ) == []

    public = graphql(conn, product_community_query(), %{"slug" => product.slug})

    assert get_in(public, ["data", "product", "reviewSummary"]) == %{
             "count" => 1,
             "averageRating" => "5.00"
           }

    assert [%{"node" => %{"authorLabel" => "Community member", "body" => "Simple and reliable."}}] =
             get_in(public, ["data", "product", "reviews", "edges"])

    refute inspect(public) =~ user.email
  end

  test "create mutations accept omitted idempotency keys for existing clients", %{conn: conn} do
    user = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    member_conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    review_response =
      graphql(member_conn, submit_review_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "rating" => 4,
          "title" => "Compatible review"
        }
      })

    assert get_in(review_response, ["data", "submitProductReview", "errors"]) == []

    question_response =
      graphql(member_conn, ask_question_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "title" => "Compatible question"
        }
      })

    assert get_in(question_response, ["data", "askProductQuestion", "errors"]) == []
    question_id = get_in(question_response, ["data", "askProductQuestion", "question", "id"])
    {:ok, {_type, question_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(question_id)

    assert {:ok, _published_question} =
             Discussions.moderate(operator.id, :question, question_entropy_id, :published)

    answer_response =
      graphql(member_conn, answer_question_mutation(), %{
        "input" => %{
          "questionId" => question_id,
          "body" => "Compatible answer"
        }
      })

    assert get_in(answer_response, ["data", "answerProductQuestion", "errors"]) == []
  end

  test "published questions receive moderated answers and an owner-selected accepted answer", %{
    conn: conn
  } do
    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    asker_conn = conn |> log_in_user(asker) |> put_req_header_same_origin()

    question_response =
      graphql(asker_conn, ask_question_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "idempotencyKey" => "question-graphql-key-01",
          "title" => "Does it support travel?",
          "body" => "Looking for a compact setup."
        }
      })

    question_id = get_in(question_response, ["data", "askProductQuestion", "question", "id"])
    {:ok, {_type, question_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(question_id)

    {:ok, _question} =
      Discussions.moderate(operator.id, :question, question_entropy_id, :published)

    answerer_conn = conn |> log_in_user(answerer) |> put_req_header_same_origin()

    answer_response =
      graphql(answerer_conn, answer_question_mutation(), %{
        "input" => %{
          "questionId" => question_id,
          "idempotencyKey" => "answer-graphql-key-001",
          "body" => "Yes, it fits in a small case."
        }
      })

    answer_id = get_in(answer_response, ["data", "answerProductQuestion", "answer", "id"])
    {:ok, {_type, answer_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(answer_id)
    {:ok, _answer} = Discussions.moderate(operator.id, :answer, answer_entropy_id, :published)

    accept_response =
      graphql(asker_conn, accept_answer_mutation(), %{
        "questionId" => question_id,
        "answerId" => answer_id
      })

    assert get_in(accept_response, ["data", "acceptProductAnswer", "errors"]) == []

    assert get_in(accept_response, [
             "data",
             "acceptProductAnswer",
             "question",
             "acceptedAnswerId"
           ]) == answer_id

    assert [%{"node" => question}] =
             get_in(graphql(conn, product_community_query(), %{"slug" => product.slug}), [
               "data",
               "product",
               "questions",
               "edges"
             ])

    assert question["acceptedAnswerId"] == answer_id

    assert question["answers"]["edges"] == [
             %{
               "node" => %{
                 "id" => answer_id,
                 "body" => "Yes, it fits in a small case.",
                 "authorLabel" => "Community member",
                 "viewerCanEdit" => false,
                 "viewerCanRemove" => false
               }
             }
           ]
  end

  test "public community connections expose bounded cursor pagination", %{conn: conn} do
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    Enum.each(1..2, fn rating ->
      user = AccountsFixtures.user_fixture()
      {:ok, review} = Discussions.submit_review(user.id, product.id, %{rating: rating + 3})

      {:ok, _published} =
        Discussions.moderate(operator.id, :review, review.entropy_id, :published)
    end)

    first_page =
      graphql(conn, paginated_reviews_query(), %{
        "slug" => product.slug,
        "first" => 1,
        "after" => nil
      })

    assert %{
             "edges" => [%{"cursor" => cursor, "node" => %{"rating" => 5}}],
             "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor}
           } = get_in(first_page, ["data", "product", "reviews"])

    second_page =
      graphql(conn, paginated_reviews_query(), %{
        "slug" => product.slug,
        "first" => 1,
        "after" => cursor
      })

    assert %{
             "edges" => [%{"node" => %{"rating" => 4}}],
             "pageInfo" => %{"hasNextPage" => false}
           } = get_in(second_page, ["data", "product", "reviews"])
  end

  test "community connection pagination preserves invalid GraphQL error messages", %{conn: conn} do
    operator = AccountsFixtures.operator_fixture()
    user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()

    {:ok, review} = Discussions.submit_review(user.id, product.id, %{rating: 4})
    {:ok, _review} = Discussions.moderate(operator.id, :review, review.entropy_id, :published)

    {:ok, question} =
      Discussions.ask_question(user.id, product.id, %{
        title: "Public question",
        body: "Public question body"
      })

    {:ok, question} =
      Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    {:ok, answer} = Discussions.answer_question(user.id, question.entropy_id, "Public answer")
    {:ok, _answer} = Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    invalid_review =
      graphql(conn, invalid_product_connection_query(), %{
        "slug" => product.slug,
        "first" => -1
      })

    assert get_in(invalid_review, ["errors", Access.at(0), "message"]) == "invalid first"

    invalid_question =
      graphql(conn, invalid_question_connection_query(), %{
        "slug" => product.slug,
        "after" => "not-a-valid-cursor"
      })

    assert get_in(invalid_question, ["errors", Access.at(0), "message"]) == "invalid cursor"

    invalid_answer =
      graphql(conn, invalid_answer_connection_query(), %{
        "id" => relay_id(:product_question, question.entropy_id),
        "first" => -1
      })

    assert get_in(invalid_answer, ["errors", Access.at(0), "message"]) == "invalid first"
  end

  describe "prefetched Relay connection windows" do
    test "matches the default page connection" do
      assert_prefetched_connection_matches_list(Enum.to_list(1..60), %{})
      assert Connection.batch_window(%{}) == {:ok, %{offset: 0, fetch_limit: 51}}
    end

    test "matches a zero-sized page connection" do
      assert_prefetched_connection_matches_list([:first, :second], %{first: 0})
      assert Connection.batch_window(%{first: 0}) == {:ok, %{offset: 0, fetch_limit: 1}}
    end

    test "matches a connection with an oversized page size" do
      assert_prefetched_connection_matches_list(Enum.to_list(1..120), %{first: 200})
      assert Connection.batch_window(%{first: 200}) == {:ok, %{offset: 0, fetch_limit: 101}}
    end

    test "matches a connection after a cursor" do
      items = [:first, :second, :third, :fourth]
      {:ok, first_page} = Connection.from_list(items, %{first: 1})
      after_cursor = first_page.page_info.end_cursor

      assert_prefetched_connection_matches_list(items, %{first: 2, after: after_cursor})

      assert Connection.batch_window(%{first: 2, after: after_cursor}) ==
               {:ok, %{offset: 1, fetch_limit: 3}}
    end

    test "matches the final page connection" do
      items = [:first, :second, :third]
      {:ok, first_page} = Connection.from_list(items, %{first: 2})

      assert_prefetched_connection_matches_list(items, %{
        first: 2,
        after: first_page.page_info.end_cursor
      })
    end

    test "rejects invalid first values" do
      assert Connection.batch_window(%{first: -1}) == {:error, :invalid_first}
      assert Connection.from_prefetched_page([:first], %{first: -1}) == {:error, :invalid_first}
    end

    test "rejects malformed cursors" do
      assert Connection.batch_window(%{after: "not-a-valid-cursor"}) == {:error, :invalid_cursor}

      assert Connection.from_prefetched_page([:first], %{after: "not-a-valid-cursor"}) ==
               {:error, :invalid_cursor}
    end
  end

  test "community writes require authentication", %{conn: conn} do
    product = SpecsFixtures.product_fixture()

    assert get_in(
             graphql(conn, submit_review_mutation(), %{
               "input" => %{
                 "productId" => relay_id(:product, product.id),
                 "idempotencyKey" => "unauth-review-key-001",
                 "rating" => 4
               }
             }),
             ["data", "submitProductReview", "errors", Access.at(0), "code"]
           ) == "UNAUTHENTICATED"

    review_id = relay_id(:product_review, Ecto.UUID.generate())

    assert get_in(
             graphql(conn, update_review_mutation(), %{
               "input" => %{"id" => review_id, "rating" => 4}
             }),
             ["data", "updateProductReview", "errors", Access.at(0), "code"]
           ) == "UNAUTHENTICATED"

    assert get_in(
             graphql(conn, remove_content_mutation(), %{
               "input" => %{"contentType" => "REVIEW", "contentId" => review_id}
             }),
             ["data", "removeCommunityContent", "errors", Access.at(0), "code"]
           ) == "UNAUTHENTICATED"
  end

  test "create mutations replay matching idempotency keys and reject conflicting payloads", %{
    conn: conn
  } do
    user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()
    member_conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    variables = %{
      "input" => %{
        "productId" => relay_id(:product, product.id),
        "idempotencyKey" => "review-replay-key-001",
        "rating" => 4,
        "title" => "Original"
      }
    }

    first = graphql(member_conn, submit_review_mutation(), variables)
    replay = graphql(member_conn, submit_review_mutation(), variables)

    first_id = get_in(first, ["data", "submitProductReview", "review", "id"])
    assert get_in(replay, ["data", "submitProductReview", "review", "id"]) == first_id

    conflict =
      graphql(member_conn, submit_review_mutation(), %{
        "input" => %{variables["input"] | "rating" => 5}
      })

    assert get_in(conflict, [
             "data",
             "submitProductReview",
             "errors",
             Access.at(0),
             "code"
           ]) == "IDEMPOTENCY_CONFLICT"
  end

  test "owner update and removal mutations cover reviews, questions, and answers", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()
    answerer_conn = conn |> log_in_user(answerer) |> put_req_header_same_origin()
    stranger_conn = conn |> log_in_user(stranger) |> put_req_header_same_origin()

    review_response =
      graphql(owner_conn, submit_review_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "idempotencyKey" => "owner-review-key-0001",
          "rating" => 3
        }
      })

    review_id = get_in(review_response, ["data", "submitProductReview", "review", "id"])

    assert get_in(
             graphql(stranger_conn, update_review_mutation(), %{
               "input" => %{"id" => review_id, "rating" => 5}
             }),
             ["data", "updateProductReview", "errors", Access.at(0), "code"]
           ) == "FORBIDDEN"

    assert %{
             "rating" => 4,
             "moderationStatus" => "PENDING",
             "viewerCanEdit" => true,
             "viewerCanRemove" => true
           } =
             get_in(
               graphql(owner_conn, update_review_mutation(), %{
                 "input" => %{"id" => review_id, "rating" => 4}
               }),
               ["data", "updateProductReview", "review"]
             )

    question_response =
      graphql(owner_conn, ask_question_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
          "idempotencyKey" => "owner-question-key-01",
          "title" => "Original question"
        }
      })

    question_id = get_in(question_response, ["data", "askProductQuestion", "question", "id"])

    assert %{"title" => "Edited question", "moderationStatus" => "PENDING"} =
             get_in(
               graphql(owner_conn, update_question_mutation(), %{
                 "input" => %{"id" => question_id, "title" => "Edited question"}
               }),
               ["data", "updateProductQuestion", "question"]
             )

    {:ok, {_type, question_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(question_id)

    {:ok, _published_question} =
      Discussions.moderate(operator.id, :question, question_entropy_id, :published)

    answer_response =
      graphql(answerer_conn, answer_question_mutation(), %{
        "input" => %{
          "questionId" => question_id,
          "idempotencyKey" => "owner-answer-key-0001",
          "body" => "Original answer"
        }
      })

    answer_id = get_in(answer_response, ["data", "answerProductQuestion", "answer", "id"])

    assert %{"body" => "Edited answer", "moderationStatus" => "PENDING"} =
             get_in(
               graphql(answerer_conn, update_answer_mutation(), %{
                 "input" => %{"id" => answer_id, "body" => "Edited answer"}
               }),
               ["data", "updateProductAnswer", "answer"]
             )

    {:ok, {_type, answer_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(answer_id)

    {:ok, _published_answer} =
      Discussions.moderate(operator.id, :answer, answer_entropy_id, :published)

    assert [] ==
             get_in(
               graphql(owner_conn, accept_answer_mutation(), %{
                 "questionId" => question_id,
                 "answerId" => answer_id
               }),
               ["data", "acceptProductAnswer", "errors"]
             )

    assert %{"moderationStatus" => "PENDING"} =
             get_in(
               graphql(answerer_conn, update_answer_mutation(), %{
                 "input" => %{"id" => answer_id, "body" => "Resubmitted answer"}
               }),
               ["data", "updateProductAnswer", "answer"]
             )

    assert Discussions.get_public_question(question_entropy_id).accepted_post_id == nil

    assert %{"removedContentId" => ^review_id, "errors" => []} =
             get_in(
               graphql(owner_conn, remove_content_mutation(), %{
                 "input" => %{"contentType" => "REVIEW", "contentId" => review_id}
               }),
               ["data", "removeCommunityContent"]
             )

    assert get_in(
             graphql(owner_conn, update_review_mutation(), %{
               "input" => %{"id" => review_id, "rating" => 5}
             }),
             ["data", "updateProductReview", "errors", Access.at(0), "code"]
           ) == "INVALID_LIFECYCLE"
  end

  test "viewer capabilities are owner-specific and false for anonymous readers", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 5})
    {:ok, _published} = Discussions.moderate(operator.id, :review, review.entropy_id, :published)

    anonymous = graphql(conn, product_community_query(), %{"slug" => product.slug})
    owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()
    stranger_conn = conn |> log_in_user(stranger) |> put_req_header_same_origin()

    assert get_in(anonymous, ["data", "product", "reviews", "edges", Access.at(0), "node"])
           |> Map.take(["viewerCanEdit", "viewerCanRemove"]) == %{
             "viewerCanEdit" => false,
             "viewerCanRemove" => false
           }

    assert get_in(graphql(owner_conn, product_community_query(), %{"slug" => product.slug}), [
             "data",
             "product",
             "reviews",
             "edges",
             Access.at(0),
             "node"
           ])
           |> Map.take(["viewerCanEdit", "viewerCanRemove"]) == %{
             "viewerCanEdit" => true,
             "viewerCanRemove" => true
           }

    assert get_in(graphql(stranger_conn, product_community_query(), %{"slug" => product.slug}), [
             "data",
             "product",
             "reviews",
             "edges",
             Access.at(0),
             "node"
           ])
           |> Map.take(["viewerCanEdit", "viewerCanRemove"]) == %{
             "viewerCanEdit" => false,
             "viewerCanRemove" => false
           }
  end

  test "owners can query non-public submissions without exposing them publicly", %{conn: conn} do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 4})
    {:ok, question} = Discussions.ask_question(owner.id, product.id, %{title: "Private draft"})

    {:ok, published_question} =
      Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    {:ok, answer} =
      Discussions.answer_question(owner.id, published_question.entropy_id, "Owner answer")

    {:ok, _hidden_review} =
      Discussions.moderate(operator.id, :review, review.entropy_id, :hidden)

    {:ok, _published_answer} =
      Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    {:ok, _rejected_question} =
      Discussions.moderate(operator.id, :question, question.entropy_id, :rejected)

    owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()

    assert %{
             "reviews" => [%{"id" => review_id, "moderationStatus" => "HIDDEN"}],
             "questions" => [%{"id" => question_id, "moderationStatus" => "REJECTED"}],
             "answers" => [%{"id" => answer_id, "moderationStatus" => "PUBLISHED"}]
           } =
             get_in(graphql(owner_conn, owner_submissions_query(), %{"slug" => product.slug}), [
               "data",
               "product",
               "viewerCommunitySubmissions"
             ])

    assert review_id == relay_id(:product_review, review.entropy_id)
    assert question_id == relay_id(:product_question, question.entropy_id)
    assert answer_id == relay_id(:product_answer, answer.entropy_id)

    {anonymous_response, anonymous_queries} =
      capture_select_queries(fn ->
        graphql(conn, owner_submissions_query(), %{"slug" => product.slug})
      end)

    assert get_in(anonymous_response, [
             "data",
             "product",
             "viewerCommunitySubmissions"
           ]) == %{"reviews" => [], "questions" => [], "answers" => []}

    refute Enum.any?(anonymous_queries, fn query ->
             Enum.any?(~w(product_reviews product_threads thread_posts), fn table ->
               String.contains?(query, ~s(FROM "#{table}"))
             end)
           end)
  end

  test "rate limits surface typed payload errors", %{conn: conn} do
    Application.put_env(:product_compare, ProductCompare.Discussions,
      community_write_limits: [review: 1, question: 10, answer: 30, report: 30]
    )

    user = AccountsFixtures.user_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    member_conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    assert [] ==
             get_in(
               graphql(member_conn, submit_review_mutation(), %{
                 "input" => %{
                   "productId" => relay_id(:product, first_product.id),
                   "idempotencyKey" => "rate-review-key-0001",
                   "rating" => 4
                 }
               }),
               ["data", "submitProductReview", "errors"]
             )

    assert get_in(
             graphql(member_conn, submit_review_mutation(), %{
               "input" => %{
                 "productId" => relay_id(:product, second_product.id),
                 "idempotencyKey" => "rate-review-key-0002",
                 "rating" => 4
               }
             }),
             ["data", "submitProductReview", "errors", Access.at(0), "code"]
           ) == "RATE_LIMITED"
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp assert_prefetched_connection_matches_list(items, args) do
    assert {:ok, %{offset: offset, fetch_limit: fetch_limit}} = Connection.batch_window(args)

    prefetched_rows = items |> Enum.drop(offset) |> Enum.take(fetch_limit)

    assert Connection.from_prefetched_page(prefetched_rows, args) ==
             Connection.from_list(items, args)
  end

  defp product_community_query do
    """
    query Community($slug: String!) {
      product(slug: $slug) {
        reviewSummary { count averageRating }
        reviews(first: 10) {
          edges { node { id rating title body verifiedPurchase authorLabel viewerCanEdit viewerCanRemove } }
          pageInfo { hasNextPage endCursor }
        }
        questions(first: 10) {
          edges {
            node {
              id title body authorLabel acceptedAnswerId viewerCanEdit viewerCanRemove
              answers(first: 5) {
                edges { node { id body authorLabel viewerCanEdit viewerCanRemove } }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """
  end

  defp paginated_reviews_query do
    """
    query PaginatedReviews($slug: String!, $first: Int!, $after: String) {
      product(slug: $slug) {
        reviews(first: $first, after: $after) {
          edges { cursor node { id rating } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
    """
  end

  defp invalid_product_connection_query do
    """
    query InvalidReviewConnection($slug: String!, $first: Int!) {
      product(slug: $slug) {
        reviews(first: $first) {
          edges { cursor }
        }
      }
    }
    """
  end

  defp invalid_question_connection_query do
    """
    query InvalidQuestionConnection($slug: String!, $after: String!) {
      product(slug: $slug) {
        questions(first: 50, after: $after) {
          edges { cursor }
        }
      }
    }
    """
  end

  defp invalid_answer_connection_query do
    """
    query InvalidAnswerConnection($id: ID!, $first: Int!) {
      productQuestion(id: $id) {
        answers(first: $first) {
          edges { cursor }
        }
      }
    }
    """
  end

  defp owner_submissions_query do
    """
    query OwnerSubmissions($slug: String!) {
      product(slug: $slug) {
        viewerCommunitySubmissions {
          reviews { id moderationStatus viewerCanEdit viewerCanRemove }
          questions { id moderationStatus viewerCanEdit viewerCanRemove }
          answers { id moderationStatus viewerCanEdit viewerCanRemove }
        }
      }
    }
    """
  end

  defp submit_review_mutation do
    """
    mutation Review($input: SubmitProductReviewInput!) {
      submitProductReview(input: $input) {
        review { id rating moderationStatus verifiedPurchase viewerCanEdit viewerCanRemove }
        errors { code field message }
      }
    }
    """
  end

  defp ask_question_mutation do
    """
    mutation Ask($input: AskProductQuestionInput!) {
      askProductQuestion(input: $input) { question { id title moderationStatus viewerCanEdit viewerCanRemove } errors { code field message } }
    }
    """
  end

  defp answer_question_mutation do
    """
    mutation Answer($input: AnswerProductQuestionInput!) {
      answerProductQuestion(input: $input) { answer { id body moderationStatus viewerCanEdit viewerCanRemove } errors { code field message } }
    }
    """
  end

  defp update_review_mutation do
    """
    mutation UpdateReview($input: UpdateProductReviewInput!) {
      updateProductReview(input: $input) {
        review { id rating title body moderationStatus viewerCanEdit viewerCanRemove }
        errors { code field message }
      }
    }
    """
  end

  defp update_question_mutation do
    """
    mutation UpdateQuestion($input: UpdateProductQuestionInput!) {
      updateProductQuestion(input: $input) {
        question { id title body moderationStatus viewerCanEdit viewerCanRemove }
        errors { code field message }
      }
    }
    """
  end

  defp update_answer_mutation do
    """
    mutation UpdateAnswer($input: UpdateProductAnswerInput!) {
      updateProductAnswer(input: $input) {
        answer { id body moderationStatus viewerCanEdit viewerCanRemove }
        errors { code field message }
      }
    }
    """
  end

  defp remove_content_mutation do
    """
    mutation RemoveContent($input: RemoveCommunityContentInput!) {
      removeCommunityContent(input: $input) {
        removedContentId
        errors { code field message }
      }
    }
    """
  end

  defp accept_answer_mutation do
    """
    mutation Accept($questionId: ID!, $answerId: ID!) {
      acceptProductAnswer(questionId: $questionId, answerId: $answerId) { question { id acceptedAnswerId } errors { code message } }
    }
    """
  end

  defp moderate_mutation do
    """
    mutation Moderate($input: ModerateCommunityContentInput!) {
      moderateCommunityContent(input: $input) { contentId moderationStatus errors { code message } }
    }
    """
  end
end
