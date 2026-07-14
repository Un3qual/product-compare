defmodule ProductCompareWeb.GraphQL.CommunityContentTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures

  test "pending reviews stay out of public ratings until operator publication", %{conn: conn} do
    user = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    member_conn = conn |> log_in_user(user) |> put_req_header_same_origin()

    response =
      graphql(member_conn, submit_review_mutation(), %{
        "input" => %{
          "productId" => relay_id(:product, product.id),
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

    assert [%{"authorLabel" => "Community member", "body" => "Simple and reliable."}] =
             get_in(public, ["data", "product", "reviews"])

    refute inspect(public) =~ user.email
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
        "input" => %{"questionId" => question_id, "body" => "Yes, it fits in a small case."}
      })

    answer_id = get_in(answer_response, ["data", "answerProductQuestion", "answer", "id"])
    {:ok, {_type, answer_entropy_id}} = ProductCompareWeb.GraphQL.GlobalId.decode(answer_id)
    {:ok, _answer} = Discussions.moderate(operator.id, :answer, answer_entropy_id, :published)

    assert get_in(
             graphql(asker_conn, accept_answer_mutation(), %{
               "questionId" => question_id,
               "answerId" => answer_id
             }),
             ["data", "acceptProductAnswer", "errors"]
           ) == []

    assert [question] =
             get_in(graphql(conn, product_community_query(), %{"slug" => product.slug}), [
               "data",
               "product",
               "questions"
             ])

    assert question["acceptedAnswerId"] == answer_id

    assert question["answers"] == [
             %{
               "id" => answer_id,
               "body" => "Yes, it fits in a small case.",
               "authorLabel" => "Community member"
             }
           ]
  end

  test "community writes require authentication", %{conn: conn} do
    product = SpecsFixtures.product_fixture()

    assert get_in(
             graphql(conn, submit_review_mutation(), %{
               "input" => %{"productId" => relay_id(:product, product.id), "rating" => 4}
             }),
             ["data", "submitProductReview", "errors", Access.at(0), "code"]
           ) == "UNAUTHENTICATED"
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/graphql", %{query: query, variables: variables}) |> json_response(200)
  end

  defp product_community_query do
    """
    query Community($slug: String!) {
      product(slug: $slug) {
        reviewSummary { count averageRating }
        reviews { id rating title body verifiedPurchase authorLabel }
        questions { id title body authorLabel acceptedAnswerId answers { id body authorLabel } }
      }
    }
    """
  end

  defp submit_review_mutation do
    """
    mutation Review($input: SubmitProductReviewInput!) {
      submitProductReview(input: $input) {
        review { id moderationStatus verifiedPurchase }
        errors { code field message }
      }
    }
    """
  end

  defp ask_question_mutation do
    """
    mutation Ask($input: AskProductQuestionInput!) {
      askProductQuestion(input: $input) { question { id moderationStatus } errors { code message } }
    }
    """
  end

  defp answer_question_mutation do
    """
    mutation Answer($input: AnswerProductQuestionInput!) {
      answerProductQuestion(input: $input) { answer { id moderationStatus } errors { code message } }
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
