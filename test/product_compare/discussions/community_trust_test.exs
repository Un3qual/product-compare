defmodule ProductCompare.Discussions.CommunityTrustTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

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

  test "review_summaries batches published ratings and preserves zero summaries" do
    operator = AccountsFixtures.operator_fixture()
    published_product = SpecsFixtures.product_fixture()
    hidden_product = SpecsFixtures.product_fixture()
    zero_review_product = SpecsFixtures.product_fixture()
    missing_product_id = zero_review_product.id + 1_000_000

    assert {:ok, published_review} =
             Discussions.submit_review(
               AccountsFixtures.user_fixture().id,
               published_product.id,
               %{
                 rating: 4,
                 title: "Published review",
                 body: "This review is public."
               }
             )

    assert {:ok, _} =
             Discussions.moderate(operator.id, :review, published_review.entropy_id, :published)

    assert {:ok, hidden_review} =
             Discussions.submit_review(AccountsFixtures.user_fixture().id, hidden_product.id, %{
               rating: 5,
               title: "Hidden review",
               body: "This review is not public."
             })

    assert {:ok, _} =
             Discussions.moderate(operator.id, :review, hidden_review.entropy_id, :hidden)

    summaries =
      Discussions.review_summaries([
        published_product.id,
        hidden_product.id,
        zero_review_product.id,
        missing_product_id,
        published_product.id
      ])

    assert summaries[published_product.id] == %{count: 1, average_rating: Decimal.new("4.00")}
    assert summaries[hidden_product.id] == %{count: 0, average_rating: nil}
    assert summaries[zero_review_product.id] == %{count: 0, average_rating: nil}
    assert summaries[missing_product_id] == %{count: 0, average_rating: nil}
    assert summaries[published_product.id] == Discussions.review_summary(published_product.id)
    assert Discussions.review_summaries([]) == %{}
  end

  test "public connection pages preserve review pages across products, hidden rows, offsets, and ties" do
    operator = AccountsFixtures.operator_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    empty_product = SpecsFixtures.product_fixture()
    timestamp = ~U[2026-07-20 20:00:00.000000Z]
    window = %{offset: 1, fetch_limit: 2}

    [first, second, third, hidden] =
      [
        public_review_fixture(first_product, operator),
        public_review_fixture(first_product, operator),
        public_review_fixture(first_product, operator),
        public_review_fixture(first_product, operator, :hidden)
      ]
      |> Enum.map(&set_inserted_at(&1, timestamp))

    second_product_review = public_review_fixture(second_product, operator)
    public_review_fixture(second_product, operator)
    parent_ids = [first_product.id, second_product.id, empty_product.id]

    expected = public_query_pages(&Discussions.public_reviews_query/1, parent_ids, window)

    assert Discussions.public_connection_pages(:reviews, parent_ids, window) == expected
    assert Enum.map(expected[first_product.id], & &1.id) == [second.id, first.id]
    refute hidden.id in Enum.map(expected[first_product.id], & &1.id)
    assert Enum.map(expected[second_product.id], & &1.id) == [second_product_review.id]
    assert expected[empty_product.id] == []
    assert third.id not in Enum.map(expected[first_product.id], & &1.id)
  end

  test "public connection pages preserve question pages and accepted-answer preloads across products" do
    operator = AccountsFixtures.operator_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    empty_product = SpecsFixtures.product_fixture()
    timestamp = ~U[2026-07-20 20:00:00.000000Z]
    window = %{offset: 1, fetch_limit: 2}

    oldest = public_question_fixture(first_product, operator)
    accepted = public_question_fixture(first_product, operator)
    newest = public_question_fixture(first_product, operator)
    hidden = public_question_fixture(first_product, operator, :hidden)
    accepted_answer = public_answer_fixture(accepted, operator)

    assert {:ok, _question} =
             Discussions.accept_answer(
               accepted.created_by,
               accepted.entropy_id,
               accepted_answer.entropy_id
             )

    [oldest, accepted, newest, hidden] =
      [oldest, accepted, newest, hidden]
      |> Enum.map(&set_inserted_at(&1, timestamp))

    second_product_question = public_question_fixture(second_product, operator)
    public_question_fixture(second_product, operator)
    parent_ids = [first_product.id, second_product.id, empty_product.id]

    expected = public_query_pages(&Discussions.public_questions_query/1, parent_ids, window)
    actual = Discussions.public_connection_pages(:questions, parent_ids, window)

    assert actual == expected
    assert Enum.map(actual[first_product.id], & &1.id) == [accepted.id, oldest.id]
    refute hidden.id in Enum.map(actual[first_product.id], & &1.id)
    assert [accepted_page] = Enum.filter(actual[first_product.id], &(&1.id == accepted.id))
    assert Ecto.assoc_loaded?(accepted_page.accepted_post)
    assert accepted_page.accepted_post.id == accepted_answer.id
    assert Enum.map(actual[second_product.id], & &1.id) == [second_product_question.id]
    assert actual[empty_product.id] == []
    assert newest.id not in Enum.map(actual[first_product.id], & &1.id)
  end

  test "public connection pages preserve answer pages across questions, hidden rows, offsets, and ties" do
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()
    first_question = public_question_fixture(product, operator)
    second_question = public_question_fixture(product, operator)
    empty_question = public_question_fixture(product, operator)
    timestamp = ~U[2026-07-20 20:00:00.000000Z]
    window = %{offset: 1, fetch_limit: 2}

    [first, second, third, hidden] =
      [
        public_answer_fixture(first_question, operator),
        public_answer_fixture(first_question, operator),
        public_answer_fixture(first_question, operator),
        public_answer_fixture(first_question, operator, :hidden)
      ]
      |> Enum.map(&set_inserted_at(&1, timestamp))

    public_answer_fixture(second_question, operator)
    second_question_answer = public_answer_fixture(second_question, operator)
    parent_ids = [first_question.id, second_question.id, empty_question.id]

    expected = public_query_pages(&Discussions.public_answers_query/1, parent_ids, window)

    assert Discussions.public_connection_pages(:answers, parent_ids, window) == expected
    assert Enum.map(expected[first_question.id], & &1.id) == [second.id, third.id]
    refute hidden.id in Enum.map(expected[first_question.id], & &1.id)
    assert Enum.map(expected[second_question.id], & &1.id) == [second_question_answer.id]
    assert expected[empty_question.id] == []
    assert first.id not in Enum.map(expected[first_question.id], & &1.id)
  end

  test "public connection pages issue one SELECT per connection kind across parents" do
    operator = AccountsFixtures.operator_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    first_question = public_question_fixture(first_product, operator)
    second_question = public_question_fixture(second_product, operator)

    public_review_fixture(first_product, operator)
    public_review_fixture(second_product, operator)
    public_answer_fixture(first_question, operator)
    public_answer_fixture(second_question, operator)

    for {kind, parent_ids} <- [
          reviews: [first_product.id, second_product.id],
          questions: [first_product.id, second_product.id],
          answers: [first_question.id, second_question.id]
        ] do
      {pages, queries} =
        capture_select_queries(fn ->
          Discussions.public_connection_pages(kind, parent_ids, %{offset: 0, fetch_limit: 2})
        end)

      assert Map.keys(pages) |> Enum.sort() == Enum.sort(parent_ids)
      assert [_query] = queries
    end
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

  test "editing an accepted-answer question clears the stale acceptance" do
    asker = AccountsFixtures.user_fixture()
    answerer = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, question} =
             Discussions.ask_question(asker.id, product.id, %{title: "Original question"})

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(answerer.id, question.entropy_id, "Original answer")

    assert {:ok, answer} =
             Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

    assert {:ok, accepted_question} =
             Discussions.accept_answer(asker.id, question.entropy_id, answer.entropy_id)

    assert accepted_question.accepted_post_id == answer.id

    assert {:ok, edited_question} =
             Discussions.update_owned(asker.id, :question, question.entropy_id, %{
               title: "Revised question"
             })

    assert edited_question.moderation_status == :pending
    assert edited_question.accepted_post_id == nil
    assert Repo.get!(ProductThread, question.id).accepted_post_id == nil
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

    assert {:ok, _hidden_question} =
             Discussions.moderate(
               operator.id,
               :question,
               published_question.entropy_id,
               :hidden
             )

    assert {:ok, replayed_after_moderation} =
             Discussions.answer_question(
               answerer.id,
               published_question.entropy_id,
               "Yes, it works.",
               "answer-key-00001"
             )

    assert replayed_after_moderation.id == answer.id
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

  test "removed reviews no longer block a later replacement review" do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, original_review} =
             Discussions.submit_review(owner.id, product.id, %{rating: 2, title: "Original"})

    assert {:ok, removed_review} =
             Discussions.remove_owned(owner.id, :review, original_review.entropy_id)

    assert removed_review.moderation_status == :removed

    assert {:ok, replacement_review} =
             Discussions.submit_review(owner.id, product.id, %{
               rating: 5,
               title: "Replacement"
             })

    refute replacement_review.id == original_review.id
    assert replacement_review.moderation_status == :pending
    assert Repo.aggregate(ProductReview, :count, :id) == 2

    assert {:ok, published_replacement} =
             Discussions.moderate(
               operator.id,
               :review,
               replacement_review.entropy_id,
               :published
             )

    assert Enum.map(Discussions.list_public_reviews(product.id), & &1.id) == [
             published_replacement.id
           ]
  end

  test "operators cannot moderate owner-removed community content" do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, review} = Discussions.submit_review(owner.id, product.id, %{rating: 3})
    assert {:ok, _removed_review} = Discussions.remove_owned(owner.id, :review, review.entropy_id)

    assert {:ok, question} =
             Discussions.ask_question(owner.id, product.id, %{title: "Question"})

    assert {:ok, published_question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    assert {:ok, answer} =
             Discussions.answer_question(owner.id, published_question.entropy_id, "Answer")

    assert {:ok, _removed_answer} =
             Discussions.remove_owned(owner.id, :answer, answer.entropy_id)

    assert {:ok, _removed_question} =
             Discussions.remove_owned(owner.id, :question, question.entropy_id)

    for {type, entropy_id} <- [
          review: review.entropy_id,
          question: question.entropy_id,
          answer: answer.entropy_id
        ] do
      assert {:error, :invalid_lifecycle} =
               Discussions.moderate(operator.id, type, entropy_id, :published)
    end

    assert Repo.get!(ProductReview, review.id).moderation_status == :removed
    assert Repo.get!(ProductThread, question.id).moderation_status == :removed
    assert Repo.get!(ThreadPost, answer.id).moderation_status == :removed
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

  defp public_query_pages(query_fun, parent_ids, %{offset: offset, fetch_limit: fetch_limit}) do
    Map.new(parent_ids, fn parent_id ->
      rows =
        parent_id
        |> query_fun.()
        |> offset(^offset)
        |> limit(^fetch_limit)
        |> Repo.all()

      {parent_id, rows}
    end)
  end

  defp public_review_fixture(product, operator, status \\ :published) do
    suffix = System.unique_integer([:positive])

    assert {:ok, review} =
             Discussions.submit_review(AccountsFixtures.user_fixture().id, product.id, %{
               rating: 4,
               title: "Review #{suffix}",
               body: "Review body #{suffix}"
             })

    assert {:ok, review} = Discussions.moderate(operator.id, :review, review.entropy_id, status)
    review
  end

  defp public_question_fixture(product, operator, status \\ :published) do
    suffix = System.unique_integer([:positive])

    assert {:ok, question} =
             Discussions.ask_question(AccountsFixtures.user_fixture().id, product.id, %{
               title: "Question #{suffix}",
               body: "Question body #{suffix}"
             })

    assert {:ok, question} =
             Discussions.moderate(operator.id, :question, question.entropy_id, status)

    question
  end

  defp public_answer_fixture(question, operator, status \\ :published) do
    suffix = System.unique_integer([:positive])

    assert {:ok, answer} =
             Discussions.answer_question(
               AccountsFixtures.user_fixture().id,
               question.entropy_id,
               "Answer #{suffix}"
             )

    assert {:ok, answer} = Discussions.moderate(operator.id, :answer, answer.entropy_id, status)
    answer
  end

  defp set_inserted_at(%ProductReview{} = review, inserted_at),
    do: update_inserted_at(ProductReview, review.id, inserted_at)

  defp set_inserted_at(%ProductThread{} = question, inserted_at),
    do: update_inserted_at(ProductThread, question.id, inserted_at)

  defp set_inserted_at(%ThreadPost{} = answer, inserted_at),
    do: update_inserted_at(ThreadPost, answer.id, inserted_at)

  defp update_inserted_at(schema, id, inserted_at) do
    schema
    |> where([record], record.id == ^id)
    |> Repo.update_all(set: [inserted_at: inserted_at])

    Repo.get!(schema, id)
  end
end
