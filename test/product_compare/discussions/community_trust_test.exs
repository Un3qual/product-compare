defmodule ProductCompare.Discussions.CommunityTrustTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.CommunityWriteWindow
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost

  setup do
    previous = Application.get_env(:product_compare, ProductCompare.Discussions)

    on_exit(fn ->
      if previous,
        do: Application.put_env(:product_compare, ProductCompare.Discussions, previous),
        else: Application.delete_env(:product_compare, ProductCompare.Discussions)
    end)

    :ok
  end

  test "community content schemas accept retained owner removal" do
    for schema <- [ProductReview, ProductThread, ThreadPost] do
      changeset =
        Ecto.Changeset.cast(struct(schema), %{moderation_status: "removed"}, [:moderation_status])

      assert changeset.valid?
      assert Ecto.Changeset.get_change(changeset, :moderation_status) == :removed
    end
  end

  test "durable write receipts enforce one idempotency key per user and mutation kind" do
    user = AccountsFixtures.user_fixture()
    content_entropy_id = Ecto.UUID.generate()

    attrs = %{
      user_id: user.id,
      mutation_kind: :review,
      idempotency_key: "community-key-0001",
      payload_digest: :crypto.hash(:sha256, "payload"),
      content_type: :review,
      content_entropy_id: content_entropy_id
    }

    assert {:ok, receipt} =
             %CommunityWriteReceipt{} |> CommunityWriteReceipt.changeset(attrs) |> Repo.insert()

    assert receipt.content_entropy_id == content_entropy_id

    assert {:error, duplicate_changeset} =
             %CommunityWriteReceipt{} |> CommunityWriteReceipt.changeset(attrs) |> Repo.insert()

    assert "has already been taken" in errors_on(duplicate_changeset).idempotency_key

    invalid_key_attrs = %{attrs | idempotency_key: "short"}

    assert {:error, invalid_key_changeset} =
             %CommunityWriteReceipt{}
             |> CommunityWriteReceipt.changeset(invalid_key_attrs)
             |> Repo.insert()

    assert "should be at least 16 character(s)" in errors_on(invalid_key_changeset).idempotency_key
  end

  test "durable write windows enforce one counter per action and UTC hour" do
    user = AccountsFixtures.user_fixture()
    window_started_at = ~U[2026-07-20 19:00:00Z]

    attrs = %{
      user_id: user.id,
      action_kind: :question,
      window_started_at: window_started_at,
      count: 1
    }

    assert {:ok, window} =
             %CommunityWriteWindow{} |> CommunityWriteWindow.changeset(attrs) |> Repo.insert()

    assert window.count == 1

    assert {:error, duplicate_changeset} =
             %CommunityWriteWindow{} |> CommunityWriteWindow.changeset(attrs) |> Repo.insert()

    assert "has already been taken" in errors_on(duplicate_changeset).window_started_at

    assert {:error, count_changeset} =
             %CommunityWriteWindow{}
             |> CommunityWriteWindow.changeset(%{attrs | action_kind: :answer, count: -1})
             |> Repo.insert()

    assert "must be greater than or equal to 0" in errors_on(count_changeset).count
  end

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

  test "create idempotency replays matching content and rejects conflicting payloads" do
    reviewer = AccountsFixtures.user_fixture()
    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    review_attrs = %{rating: "4", title: "Clear sound", body: "Useful."}

    assert {:ok, review} =
             Discussions.submit_review(reviewer.id, product.id, review_attrs, "review-key-00001")

    assert {:ok, replayed_review} =
             Discussions.submit_review(reviewer.id, product.id, review_attrs, "review-key-00001")

    assert replayed_review.id == review.id

    assert {:error, :idempotency_conflict} =
             Discussions.submit_review(
               reviewer.id,
               product.id,
               %{review_attrs | rating: 5},
               "review-key-00001"
             )

    question_attrs = %{title: "Outdoor use?", body: "Below freezing?"}

    assert {:ok, question} =
             Discussions.ask_question(asker.id, product.id, question_attrs, "question-key-001")

    assert {:ok, replayed_question} =
             Discussions.ask_question(asker.id, product.id, question_attrs, "question-key-001")

    assert replayed_question.id == question.id

    assert {:ok, published_question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(
               answerer.id,
               published_question.entropy_id,
               "Yes, it works.",
               "answer-key-00001"
             )

    assert {:ok, replayed_answer} =
             Discussions.answer_question(
               answerer.id,
               published_question.entropy_id,
               "Yes, it works.",
               "answer-key-00001"
             )

    assert replayed_answer.id == answer.id
    assert Repo.aggregate(CommunityWriteReceipt, :count, :id) == 3
    assert Repo.aggregate(CommunityWriteWindow, :sum, :count) == 3
  end

  test "configured UTC-hour limits reject limit plus one and keep actions independent" do
    Application.put_env(:product_compare, ProductCompare.Discussions,
      community_write_limits: [review: 1, question: 2, answer: 1, report: 1]
    )

    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, first_question} =
             Discussions.ask_question(asker.id, product.id, %{title: "Question one"})

    assert {:ok, _second_question} =
             Discussions.ask_question(asker.id, product.id, %{title: "Question two"})

    assert {:error, :rate_limited} =
             Discussions.ask_question(asker.id, product.id, %{title: "Question three"})

    assert {:ok, first_question} =
             Discussions.moderate(operator.id, :question, first_question.entropy_id, :published)

    assert {:ok, _answer} =
             Discussions.answer_question(answerer.id, first_question.entropy_id, "First answer")

    assert {:error, :rate_limited} =
             Discussions.answer_question(answerer.id, first_question.entropy_id, "Second answer")

    assert {:ok, review} = Discussions.submit_review(asker.id, product.id, %{rating: 4})

    assert {:error, :rate_limited} =
             Discussions.update_owned(asker.id, :review, review.entropy_id, %{rating: 5})

    assert Repo.get_by!(CommunityWriteWindow, user_id: asker.id, action_kind: :question).count ==
             2

    assert Repo.get_by!(CommunityWriteWindow, user_id: asker.id, action_kind: :review).count == 1

    assert Repo.get_by!(CommunityWriteWindow, user_id: answerer.id, action_kind: :answer).count ==
             1
  end

  test "owners edit each content type back to pending and non-owners are rejected" do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 3})

    assert {:ok, review} =
             Discussions.moderate(operator.id, :review, review.entropy_id, :published)

    assert {:error, :forbidden} =
             Discussions.update_owned(stranger.id, :review, review.entropy_id, %{rating: 4})

    assert {:ok, edited_review} =
             Discussions.update_owned(owner.id, :review, review.entropy_id, %{rating: 4})

    assert edited_review.rating == 4
    assert edited_review.moderation_status == :pending

    assert {:ok, question} =
             Discussions.ask_question(owner.id, product.id, %{title: "Original question"})

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :hidden)

    assert {:error, :forbidden} =
             Discussions.update_owned(stranger.id, :question, question.entropy_id, %{
               title: "Forbidden"
             })

    assert {:ok, edited_question} =
             Discussions.update_owned(owner.id, :question, question.entropy_id, %{
               title: "Edited question"
             })

    assert edited_question.title == "Edited question"
    assert edited_question.moderation_status == :pending

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(answerer.id, question.entropy_id, "Original")

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    assert {:ok, accepted} =
             Discussions.accept_answer(owner.id, question.entropy_id, answer.entropy_id)

    assert accepted.accepted_post_id == answer.id

    assert {:error, :forbidden} =
             Discussions.update_owned(stranger.id, :answer, answer.entropy_id, %{
               body: "Forbidden"
             })

    assert {:ok, edited_answer} =
             Discussions.update_owned(answerer.id, :answer, answer.entropy_id, %{body: "Edited"})

    assert edited_answer.body_md == "Edited"
    assert edited_answer.moderation_status == :pending
    assert Repo.get!(ProductThread, question.id).accepted_post_id == nil
  end

  test "removed content is retained, cannot be edited, and accepted answer removal cleans up" do
    owner = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 3})
    assert {:ok, removed_review} = Discussions.remove_owned(owner.id, :review, review.entropy_id)
    assert removed_review.moderation_status == :removed
    assert Repo.get!(ProductReview, review.id).moderation_status == :removed

    assert {:error, :invalid_lifecycle} =
             Discussions.update_owned(owner.id, :review, review.entropy_id, %{rating: 4})

    assert {:error, :forbidden} =
             Discussions.remove_owned(stranger.id, :review, review.entropy_id)

    assert {:ok, question} =
             Discussions.ask_question(owner.id, product.id, %{title: "Question"})

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} = Discussions.answer_question(answerer.id, question.entropy_id, "Answer")

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    assert {:ok, _accepted} =
             Discussions.accept_answer(owner.id, question.entropy_id, answer.entropy_id)

    assert {:ok, removed_answer} =
             Discussions.remove_owned(answerer.id, :answer, answer.entropy_id)

    assert removed_answer.moderation_status == :removed
    assert Repo.get!(ProductThread, question.id).accepted_post_id == nil
    assert Repo.get!(ThreadPost, answer.id).moderation_status == :removed

    assert {:error, :invalid_lifecycle} =
             Discussions.update_owned(answerer.id, :answer, answer.entropy_id, %{body: "Again"})

    assert Discussions.list_public_reviews(product.id) == []
  end

  test "editing rejected content resubmits it and removals do not consume rate limits" do
    Application.put_env(:product_compare, ProductCompare.Discussions,
      community_write_limits: [review: 5, question: 10, answer: 2, report: 30]
    )

    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, question} =
             Discussions.ask_question(owner.id, product.id, %{title: "Question"})

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} = Discussions.answer_question(owner.id, question.entropy_id, "Answer")

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :rejected)

    assert {:error, invalid_changeset} =
             Discussions.update_owned(owner.id, :answer, answer.entropy_id, %{body: nil})

    assert "can't be blank" in errors_on(invalid_changeset).body_md

    assert {:ok, edited_answer} =
             Discussions.update_owned(owner.id, :answer, answer.entropy_id, %{body: "Resubmitted"})

    assert edited_answer.moderation_status == :pending

    assert {:ok, removed_answer} =
             Discussions.remove_owned(owner.id, :answer, answer.entropy_id)

    assert removed_answer.moderation_status == :removed
    assert Repo.get_by!(CommunityWriteWindow, user_id: owner.id, action_kind: :answer).count == 2
  end

  test "report limits count only committed reports" do
    Application.put_env(:product_compare, ProductCompare.Discussions,
      community_write_limits: [review: 5, question: 10, answer: 30, report: 1]
    )

    author = AccountsFixtures.user_fixture()
    reporter = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, review} = Discussions.submit_review(author.id, product.id, %{rating: 2})

    assert {:error, %Ecto.Changeset{}} =
             Discussions.report(reporter.id, :review, review.entropy_id, "x")

    assert {:ok, _report} = Discussions.report(reporter.id, :review, review.entropy_id, "spam")

    assert {:error, :already_reported} =
             Discussions.report(reporter.id, :review, review.entropy_id, "spam")

    assert Repo.get_by!(CommunityWriteWindow, user_id: reporter.id, action_kind: :report).count ==
             1
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
