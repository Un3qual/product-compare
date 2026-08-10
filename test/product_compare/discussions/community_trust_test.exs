defmodule ProductCompare.Discussions.CommunityTrustTest do
  use ProductCompare.DataCase, async: false

  import Ecto.Query
  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias Ecto.Adapters.SQL
  alias ProductCompare.Discussions
  alias ProductCompare.Discussions.Submissions.WriteLimits
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

  test "review submission rejects a 121-code-point emoji ZWJ title" do
    user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()
    title = emoji_zwj_text(121)

    assert_codepoint_length(title, 121)
    assert String.length(title) < 121

    assert {:error, changeset} =
             Discussions.submit_review(user.id, product.id, %{rating: 5, title: title})

    assert "should be at most 120 character(s)" in errors_on(changeset).title
  end

  test "review submission rejects a 5,001-code-point decomposed body" do
    user = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()
    body = String.duplicate("e\u0301", 2_500) <> "x"

    assert_codepoint_length(body, 5_001)
    assert String.length(body) == 2_501

    assert {:error, changeset} =
             Discussions.submit_review(user.id, product.id, %{rating: 5, body: body})

    assert "should be at most 5000 character(s)" in errors_on(changeset).body_md
  end

  test "review submissions accept nil and code-point boundary fields" do
    product = SpecsFixtures.product_fixture()
    title = emoji_zwj_text(120)
    body = String.duplicate("e\u0301", 2_500)

    assert_codepoint_length(title, 120)
    assert_codepoint_length(body, 5_000)

    assert {:ok, _review} =
             Discussions.submit_review(AccountsFixtures.user_fixture().id, product.id, %{
               rating: 5
             })

    assert {:ok, _review} =
             Discussions.submit_review(AccountsFixtures.user_fixture().id, product.id, %{
               rating: 4,
               title: title,
               body: body
             })
  end

  test "report submissions accept code-point-valid emoji reasons" do
    author = AccountsFixtures.user_fixture()
    reporter = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()
    reason = "👩‍👩‍👧‍👦"

    assert_codepoint_length(reason, 7)
    assert String.length(reason) == 1
    assert {:ok, review} = Discussions.submit_review(author.id, product.id, %{rating: 5})

    assert {:ok, _report} = Discussions.report(reporter.id, :review, review.entropy_id, reason)
  end

  test "report submissions retain their three- and 500-code-point boundaries" do
    author = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()
    three_code_point_reason = "bad"
    five_hundred_code_point_reason = String.duplicate("x", 500)

    assert_codepoint_length(three_code_point_reason, 3)
    assert_codepoint_length(five_hundred_code_point_reason, 500)
    assert {:ok, review} = Discussions.submit_review(author.id, product.id, %{rating: 5})

    assert {:ok, _report} =
             Discussions.report(
               AccountsFixtures.user_fixture().id,
               :review,
               review.entropy_id,
               three_code_point_reason
             )

    assert {:ok, _report} =
             Discussions.report(
               AccountsFixtures.user_fixture().id,
               :review,
               review.entropy_id,
               five_hundred_code_point_reason
             )
  end

  test "durable write receipts enforce one idempotency key per user and content type" do
    user = AccountsFixtures.user_fixture()
    content_entropy_id = Ecto.UUID.generate()

    attrs = %{
      user_id: user.id,
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

    assert CommunityWriteWindow.changeset(%CommunityWriteWindow{}, attrs).valid?

    invalid_hour_changeset =
      CommunityWriteWindow.changeset(%CommunityWriteWindow{}, %{
        attrs
        | window_started_at: ~U[2026-07-20 19:01:00Z]
      })

    refute invalid_hour_changeset.valid?
    assert "is invalid" in errors_on(invalid_hour_changeset).window_started_at

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

    SQL.query!(Repo, "SET LOCAL TIME ZONE 'Asia/Kathmandu'")

    assert {:ok, utc_window} =
             %CommunityWriteWindow{}
             |> CommunityWriteWindow.changeset(%{attrs | action_kind: :answer, count: 1})
             |> Repo.insert()

    assert DateTime.compare(utc_window.window_started_at, window_started_at) == :eq

    assert {:ok, _result} =
             insert_community_write_window(user.id, "review", ~U[2026-07-20 20:00:00Z])

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :check_violation,
                constraint: "community_write_windows_hour_check"
              }
            }} =
             insert_community_write_window(user.id, "report", ~U[2026-07-20 20:01:00Z])
  end

  test "write limit increments require an outer transaction before mutation" do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      try do
        assert_raise ArgumentError, fn -> WriteLimits.increment!(user.id, :review) end
        assert Repo.get_by(CommunityWriteWindow, user_id: user.id) == nil
      after
        Repo.delete_all(from window in CommunityWriteWindow, where: window.user_id == ^user.id)
        Repo.delete!(user)
      end
    end)
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

  test "public question batches preserve publication, accepted answers, missing values, and query budgets" do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture()

    assert {:ok, accepted_question} =
             Discussions.ask_question(owner.id, product.id, %{title: "Accepted question"})

    assert {:ok, accepted_question} =
             Discussions.moderate(
               operator.id,
               :question,
               accepted_question.entropy_id,
               :published
             )

    accepted_answer = public_answer_fixture(accepted_question, operator)

    assert {:ok, _accepted_question} =
             Discussions.accept_answer(
               owner.id,
               accepted_question.entropy_id,
               accepted_answer.entropy_id
             )

    second_question = public_question_fixture(product, operator)
    hidden_question = public_question_fixture(product, operator, :hidden)
    missing_id = Ecto.UUID.generate()

    {initial, initial_queries} =
      capture_select_queries(fn ->
        Discussions.get_public_questions([accepted_question.entropy_id])
      end)

    {grown, grown_queries} =
      capture_select_queries(fn ->
        Discussions.get_public_questions([
          accepted_question.entropy_id,
          second_question.entropy_id,
          accepted_question.entropy_id,
          hidden_question.entropy_id,
          missing_id,
          "invalid"
        ])
      end)

    assert initial[accepted_question.entropy_id].accepted_post.id == accepted_answer.id
    assert grown[accepted_question.entropy_id].accepted_post.id == accepted_answer.id
    assert grown[second_question.entropy_id].accepted_post == nil
    assert grown[hidden_question.entropy_id] == nil
    assert grown[missing_id] == nil
    assert Map.has_key?(grown, "invalid")
    assert grown["invalid"] == nil
    assert Discussions.get_public_questions([]) == %{}
    assert length(grown_queries) == length(initial_queries)
  end

  test "viewer submission batches preserve owner visibility across products" do
    owner = AccountsFixtures.user_fixture()
    stranger = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    public_only_product = SpecsFixtures.product_fixture()
    empty_product = SpecsFixtures.product_fixture()
    missing_product_id = empty_product.id + 1_000_000

    assert {:ok, pending_review} =
             Discussions.submit_review(owner.id, first_product.id, %{rating: 4})

    assert {:ok, hidden_review} =
             Discussions.submit_review(owner.id, second_product.id, %{rating: 3})

    assert {:ok, hidden_review} =
             Discussions.moderate(operator.id, :review, hidden_review.entropy_id, :hidden)

    assert {:ok, published_review} =
             Discussions.submit_review(owner.id, public_only_product.id, %{rating: 5})

    assert {:ok, _published_review} =
             Discussions.moderate(
               operator.id,
               :review,
               published_review.entropy_id,
               :published
             )

    assert {:ok, _stranger_review} =
             Discussions.submit_review(stranger.id, first_product.id, %{rating: 2})

    assert {:ok, pending_question} =
             Discussions.ask_question(owner.id, first_product.id, %{title: "Pending question"})

    assert {:ok, hidden_question} =
             Discussions.ask_question(owner.id, second_product.id, %{title: "Hidden question"})

    assert {:ok, hidden_question} =
             Discussions.moderate(
               operator.id,
               :question,
               hidden_question.entropy_id,
               :published
             )

    assert {:ok, published_under_hidden_parent} =
             Discussions.answer_question(owner.id, hidden_question.entropy_id, "Owner answer")

    assert {:ok, published_under_hidden_parent} =
             Discussions.moderate(
               operator.id,
               :answer,
               published_under_hidden_parent.entropy_id,
               :published
             )

    assert {:ok, hidden_question} =
             Discussions.moderate(
               operator.id,
               :question,
               hidden_question.entropy_id,
               :hidden
             )

    assert {:ok, public_question} =
             Discussions.ask_question(owner.id, public_only_product.id, %{
               title: "Public question"
             })

    assert {:ok, public_question} =
             Discussions.moderate(
               operator.id,
               :question,
               public_question.entropy_id,
               :published
             )

    assert {:ok, pending_answer} =
             Discussions.answer_question(owner.id, public_question.entropy_id, "Pending answer")

    assert {:ok, public_answer} =
             Discussions.answer_question(stranger.id, public_question.entropy_id, "Public answer")

    assert {:ok, _public_answer} =
             Discussions.moderate(operator.id, :answer, public_answer.entropy_id, :published)

    product_ids = [
      first_product.id,
      second_product.id,
      public_only_product.id,
      empty_product.id,
      missing_product_id,
      first_product.id,
      -1
    ]

    actual = Discussions.viewer_community_submissions_for_products(owner.id, product_ids)

    assert Map.keys(actual) |> Enum.sort() ==
             [
               first_product.id,
               second_product.id,
               public_only_product.id,
               empty_product.id,
               missing_product_id
             ]
             |> Enum.sort()

    assert actual[first_product.id] == %{
             reviews: [pending_review],
             questions: [pending_question],
             answers: []
           }

    assert actual[second_product.id] == %{
             reviews: [hidden_review],
             questions: [hidden_question],
             answers: [published_under_hidden_parent]
           }

    assert actual[public_only_product.id] == %{
             reviews: [],
             questions: [],
             answers: [pending_answer]
           }

    assert actual[empty_product.id] == %{reviews: [], questions: [], answers: []}
    assert actual[missing_product_id] == %{reviews: [], questions: [], answers: []}
    assert Discussions.viewer_community_submissions_for_products(owner.id, []) == %{}
  end

  test "viewer submission batches use one SELECT per content kind across products" do
    owner = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()

    for product <- [first_product, second_product] do
      assert {:ok, _review} = Discussions.submit_review(owner.id, product.id, %{rating: 4})

      assert {:ok, question} =
               Discussions.ask_question(owner.id, product.id, %{title: "Question"})

      assert {:ok, question} =
               Discussions.moderate(operator.id, :question, question.entropy_id, :published)

      assert {:ok, _answer} =
               Discussions.answer_question(owner.id, question.entropy_id, "Answer")
    end

    {submissions, queries} =
      capture_select_queries(fn ->
        Discussions.viewer_community_submissions_for_products(owner.id, [
          first_product.id,
          second_product.id
        ])
      end)

    assert Map.keys(submissions) |> Enum.sort() ==
             [first_product.id, second_product.id] |> Enum.sort()

    assert [_, _, _] = queries
  end

  test "viewer submission batches apply the owner limit independently per product" do
    owner = AccountsFixtures.user_fixture()
    first_product = SpecsFixtures.product_fixture()
    second_product = SpecsFixtures.product_fixture()
    timestamp = ~U[2026-07-21 12:00:00.000000Z]

    first_question_ids =
      for index <- 1..51 do
        %ProductThread{}
        |> ProductThread.changeset(%{
          product_id: first_product.id,
          created_by: owner.id,
          title: "Question #{index}"
        })
        |> Repo.insert!()
        |> set_inserted_at(timestamp)
        |> Map.fetch!(:id)
      end

    second_question =
      %ProductThread{}
      |> ProductThread.changeset(%{
        product_id: second_product.id,
        created_by: owner.id,
        title: "Second product question"
      })
      |> Repo.insert!()

    submissions =
      Discussions.viewer_community_submissions_for_products(owner.id, [
        first_product.id,
        second_product.id
      ])

    assert Enum.map(submissions[first_product.id].questions, & &1.id) ==
             first_question_ids |> Enum.reverse() |> Enum.take(50)

    assert Enum.map(submissions[second_product.id].questions, & &1.id) == [
             second_question.id
           ]
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

    expected_review_digest =
      :crypto.hash(
        :sha256,
        :erlang.term_to_binary(
          {:review, nil,
           [
             product_id: product.id,
             merchant_product_id: nil,
             rating: 4,
             title: "Clear sound",
             body_md: "Useful."
           ]},
          [:deterministic, minor_version: 2]
        )
      )

    assert Repo.get_by!(CommunityWriteReceipt,
             user_id: reviewer.id,
             content_type: :review,
             idempotency_key: "review-key-00001"
           ).payload_digest == expected_review_digest

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

  defp insert_community_write_window(user_id, action_kind, window_started_at) do
    Repo.query(
      """
      INSERT INTO community_write_windows (
        user_id, action_kind, window_started_at, count, inserted_at, updated_at
      )
      VALUES ($1, $2, $3, 1, now(), now())
      """,
      [user_id, action_kind, window_started_at]
    )
  end

  defp emoji_zwj_text(code_point_count) do
    family = "👩‍👩‍👧‍👦"
    family_code_point_count = Enum.count(String.codepoints(family))
    family_count = div(code_point_count, family_code_point_count)
    remainder = rem(code_point_count, family_code_point_count)

    String.duplicate(family, family_count) <> String.duplicate("x", remainder)
  end

  defp assert_codepoint_length(text, expected) do
    assert Enum.count_until(String.codepoints(text), expected + 1) == expected
  end
end
