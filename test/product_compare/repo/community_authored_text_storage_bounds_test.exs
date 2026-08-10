defmodule ProductCompare.Repo.CommunityAuthoredTextStorageBoundsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo

  test "product threads reject a zero-code-point title with the named storage constraint" do
    %{product: product, user: user} = thread_parents()

    assert_check_violation(
      insert_thread(product.id, user.id, "", nil),
      "product_threads_title_length_check"
    )
  end

  test "product threads reject a 201-code-point decomposed title with the named storage constraint" do
    %{product: product, user: user} = thread_parents()
    title = String.duplicate("e\u0301", 100) <> "x"

    assert_codepoint_length(title, 201)
    assert String.length(title) == 101

    assert_check_violation(
      insert_thread(product.id, user.id, title, nil),
      "product_threads_title_length_check"
    )
  end

  test "product threads reject a 5,001-code-point emoji ZWJ body with the named storage constraint" do
    %{product: product, user: user} = thread_parents()
    body = emoji_zwj_text(5_001)

    assert_codepoint_length(body, 5_001)
    assert String.length(body) < 5_001

    assert_check_violation(
      insert_thread(product.id, user.id, "Thread", body),
      "product_threads_body_length_check"
    )
  end

  test "thread posts reject a 5,001-code-point decomposed body with the named storage constraint" do
    %{thread: thread, user: user} = valid_thread()
    body = String.duplicate("e\u0301", 2_500) <> "x"

    assert_codepoint_length(body, 5_001)
    assert String.length(body) == 2_501

    assert_check_violation(
      insert_post(thread.id, user.id, body),
      "thread_posts_body_length_check"
    )
  end

  test "product reviews reject a 121-code-point emoji ZWJ title with the named storage constraint" do
    %{product: product, user: user} = review_parents()
    title = emoji_zwj_text(121)

    assert_codepoint_length(title, 121)
    assert String.length(title) < 121

    assert_check_violation(
      insert_review(product.id, user.id, title, nil),
      "product_reviews_title_length_check"
    )
  end

  test "product reviews reject a 5,001-code-point decomposed body with the named storage constraint" do
    %{product: product, user: user} = review_parents()
    body = String.duplicate("e\u0301", 2_500) <> "x"

    assert_codepoint_length(body, 5_001)
    assert String.length(body) == 2_501

    assert_check_violation(
      insert_review(product.id, user.id, nil, body),
      "product_reviews_body_length_check"
    )
  end

  test "community reports reject a two-code-point reason with the named storage constraint" do
    %{review: review} = valid_review()
    reporter = AccountsFixtures.user_fixture()

    assert_check_violation(
      insert_report(reporter.id, review.id, "no"),
      "community_reports_reason_length_check"
    )
  end

  test "community authored text accepts its established direct-write boundaries" do
    %{product: product, user: user} = thread_parents()
    one_code_point_title = "x"
    two_hundred_code_point_title = String.duplicate("e\u0301", 100)
    five_thousand_code_point_emoji_body = emoji_zwj_text(5_000)
    five_thousand_code_point_decomposed_body = String.duplicate("e\u0301", 2_500)
    one_hundred_twenty_code_point_emoji_title = emoji_zwj_text(120)

    assert_codepoint_length(one_code_point_title, 1)
    assert_codepoint_length(two_hundred_code_point_title, 200)
    assert_codepoint_length(five_thousand_code_point_emoji_body, 5_000)
    assert_codepoint_length(five_thousand_code_point_decomposed_body, 5_000)
    assert_codepoint_length(one_hundred_twenty_code_point_emoji_title, 120)

    assert {:ok, %{rows: [[thread_id]]}} =
             insert_thread(product.id, user.id, one_code_point_title, nil)

    assert {:ok, %{rows: [[_thread_id]]}} =
             insert_thread(
               product.id,
               user.id,
               two_hundred_code_point_title,
               five_thousand_code_point_emoji_body
             )

    assert {:ok, %{rows: [[_post_id]]}} =
             insert_post(thread_id, user.id, five_thousand_code_point_decomposed_body)

    review_user = AccountsFixtures.user_fixture()

    assert {:ok, %{rows: [[review_id]]}} = insert_review(product.id, review_user.id, nil, nil)

    review_body_user = AccountsFixtures.user_fixture()

    assert {:ok, %{rows: [[_review_id]]}} =
             insert_review(
               product.id,
               review_body_user.id,
               one_hundred_twenty_code_point_emoji_title,
               five_thousand_code_point_decomposed_body
             )

    reporter = AccountsFixtures.user_fixture()
    assert {:ok, %{rows: [[_report_id]]}} = insert_report(reporter.id, review_id, "bad")
  end

  test "community reports retain the existing 500-code-point varchar boundary" do
    %{review: review} = valid_review()
    valid_reason = String.duplicate("x", 500)
    overlong_reason = valid_reason <> "x"

    assert_codepoint_length(valid_reason, 500)
    assert_codepoint_length(overlong_reason, 501)

    assert {:ok, %{rows: [[_report_id]]}} =
             insert_report(AccountsFixtures.user_fixture().id, review.id, valid_reason)

    assert {:error, %Postgrex.Error{postgres: %{code: :string_data_right_truncation}}} =
             insert_report(AccountsFixtures.user_fixture().id, review.id, overlong_reason)
  end

  defp thread_parents do
    %{product: SpecsFixtures.product_fixture(), user: AccountsFixtures.user_fixture()}
  end

  defp review_parents, do: thread_parents()

  defp valid_thread do
    %{product: product, user: user} = thread_parents()
    {:ok, %{rows: [[thread_id]]}} = insert_thread(product.id, user.id, "Thread", nil)
    %{thread: %{id: thread_id}, user: user}
  end

  defp valid_review do
    %{product: product, user: user} = review_parents()
    {:ok, %{rows: [[review_id]]}} = insert_review(product.id, user.id, nil, nil)
    %{review: %{id: review_id}}
  end

  defp insert_thread(product_id, user_id, title, body_md) do
    Repo.query(
      """
      INSERT INTO product_threads (product_id, created_by, title, body_md, inserted_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING id
      """,
      [product_id, user_id, title, body_md]
    )
  end

  defp insert_post(thread_id, user_id, body_md) do
    Repo.query(
      """
      INSERT INTO thread_posts (thread_id, user_id, body_md, inserted_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      RETURNING id
      """,
      [thread_id, user_id, body_md]
    )
  end

  defp insert_review(product_id, user_id, title, body_md) do
    Repo.query(
      """
      INSERT INTO product_reviews (product_id, user_id, rating, title, body_md, inserted_at, updated_at)
      VALUES ($1, $2, 5, $3, $4, now(), now())
      RETURNING id
      """,
      [product_id, user_id, title, body_md]
    )
  end

  defp insert_report(reporter_id, review_id, reason) do
    Repo.query(
      """
      INSERT INTO community_reports (reporter_id, review_id, reason, inserted_at)
      VALUES ($1, $2, $3, now())
      RETURNING id
      """,
      [reporter_id, review_id, reason]
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

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
