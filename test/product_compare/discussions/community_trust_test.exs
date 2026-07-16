defmodule ProductCompare.Discussions.CommunityTrustTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  test "only published reviews affect public lists and aggregates, and offer selection is not purchase proof" do
    user = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    merchant_product = merchant_product_fixture(product)

    assert {:ok, review} =
             Discussions.submit_review(user.id, product.id, %{
               rating: 4,
               title: "Clear sound",
               body: "Useful after a week.",
               merchant_product_id: merchant_product.id
             })

    assert review.moderation_status == :pending
    refute review.verified_purchase
    assert Discussions.list_public_reviews(product.id) == []
    assert Discussions.review_summary(product.id) == %{count: 0, average_rating: nil}

    assert {:ok, published} =
             Discussions.moderate(operator.id, :review, review.entropy_id, :published, "safe")

    assert published.moderation_status == :published
    assert Enum.map(Discussions.list_public_reviews(product.id), & &1.id) == [review.id]

    assert Discussions.review_summary(product.id) == %{
             count: 1,
             average_rating: Decimal.new("4.00")
           }

    assert {:error, changeset} = Discussions.submit_review(user.id, product.id, %{rating: 5})
    assert "has already been taken" in errors_on(changeset).product_id
  end

  test "published questions accept only a published answer from the same thread" do
    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, question} =
             Discussions.ask_question(asker.id, product.id, %{
               title: "Does it work outdoors?",
               body: "I need it below freezing."
             })

    assert Discussions.list_public_questions(product.id) == []

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(answerer.id, question.entropy_id, "Yes, down to -10 C.")

    assert {:error, :answer_not_published} =
             Discussions.accept_answer(asker.id, question.entropy_id, answer.entropy_id)

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    assert {:error, :forbidden} =
             Discussions.accept_answer(answerer.id, question.entropy_id, answer.entropy_id)

    assert {:ok, accepted_question} =
             Discussions.accept_answer(asker.id, question.entropy_id, answer.entropy_id)

    assert accepted_question.accepted_post_id == answer.id
    [public_question] = Discussions.list_public_questions(product.id)
    assert public_question.accepted_post_id == answer.id
    assert Enum.map(public_question.posts, & &1.id) == [answer.id]
  end

  test "unpublishing an accepted answer clears the accepted answer reference" do
    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, question} =
             Discussions.ask_question(asker.id, product.id, %{
               title: "Does it work outdoors?",
               body: "I need it below freezing."
             })

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(answerer.id, question.entropy_id, "Yes, down to -10 C.")

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    assert {:ok, accepted_question} =
             Discussions.accept_answer(asker.id, question.entropy_id, answer.entropy_id)

    assert accepted_question.accepted_post_id == answer.id

    assert {:ok, hidden_answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :hidden)

    assert hidden_answer.moderation_status == :hidden
    public_question = Discussions.get_public_question(question.entropy_id)
    assert is_nil(public_question.accepted_post_id)
    assert is_nil(public_question.accepted_post)
  end

  test "reports are attributable, duplicate-safe, and moderation requires an operator" do
    author = AccountsFixtures.user_fixture()
    reporter = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, review} = Discussions.submit_review(author.id, product.id, %{rating: 2})
    assert {:ok, report} = Discussions.report(reporter.id, :review, review.entropy_id, "spam")
    assert report.reason == "spam"

    assert {:error, :already_reported} =
             Discussions.report(reporter.id, :review, review.entropy_id, "spam")

    assert {:error, :forbidden} =
             Discussions.moderate(reporter.id, :review, review.entropy_id, :published)
  end

  defp merchant_product_fixture(product) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Community #{suffix}",
        domain: "community-#{suffix}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://community.example/#{suffix}",
        currency: "USD",
        is_active: true
      })

    offer
  end
end
