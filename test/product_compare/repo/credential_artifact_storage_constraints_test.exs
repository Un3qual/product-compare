defmodule ProductCompare.Repo.CredentialArtifactStorageConstraintsTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.Fixtures.AccountsFixtures

  test "users_tokens rejects a 31-byte token hash with its named storage constraint" do
    user = user_fixture()

    assert_check_violation(
      insert_user_token(user.id, :binary.copy(<<1>>, 31)),
      "users_tokens_hash_length_check"
    )
  end

  test "users_tokens rejects a 33-byte token hash with its named storage constraint" do
    user = user_fixture()

    assert_check_violation(
      insert_user_token(user.id, :binary.copy(<<1>>, 33)),
      "users_tokens_hash_length_check"
    )
  end

  test "api_tokens rejects an empty token prefix with its named storage constraint" do
    user = user_fixture()

    assert_check_violation(
      insert_api_token(user.id, "", nil, 2),
      "api_tokens_prefix_length_check"
    )
  end

  test "api_tokens rejects a 33-code-point decomposed token prefix" do
    user = user_fixture()
    overlong_prefix = String.duplicate("e\u0301", 16) <> "x"

    assert Enum.count_until(String.codepoints(overlong_prefix), 34) == 33
    assert String.length(overlong_prefix) == 17

    assert_check_violation(
      insert_api_token(user.id, overlong_prefix, nil, 3),
      "api_tokens_prefix_length_check"
    )
  end

  test "api_tokens rejects a 121-code-point emoji ZWJ label" do
    user = user_fixture()
    family = "👩‍👩‍👧‍👦"
    overlong_label = String.duplicate(family, 17) <> "xy"

    assert Enum.count_until(String.codepoints(overlong_label), 122) == 121
    assert String.length(overlong_label) == 19

    assert_check_violation(
      insert_api_token(user.id, "a", overlong_label, 4),
      "api_tokens_label_length_check"
    )
  end

  test "credential artifacts accept their valid storage boundaries" do
    user = user_fixture()
    boundary_prefix = String.duplicate("e\u0301", 16)
    family = "👩‍👩‍👧‍👦"
    boundary_label = String.duplicate(family, 17) <> "x"

    assert Enum.count_until(String.codepoints(boundary_prefix), 33) == 32
    assert Enum.count_until(String.codepoints(boundary_label), 121) == 120
    assert String.length(boundary_prefix) == 16
    assert String.length(boundary_label) == 18

    assert {:ok, _result} = insert_user_token(user.id, :binary.copy(<<1>>, 32))
    assert {:ok, _result} = insert_api_token(user.id, "a", nil, 2)

    assert {:ok, _result} =
             insert_api_token(user.id, boundary_prefix, boundary_label, 3)
  end

  defp insert_user_token(user_id, token_hash) do
    ProductCompare.Repo.query(
      """
      INSERT INTO users_tokens (user_id, token_hash, context, expires_at, inserted_at)
      VALUES ($1, $2, 'session', now() + interval '1 day', now())
      """,
      [user_id, token_hash]
    )
  end

  defp insert_api_token(user_id, token_prefix, label, hash_byte) do
    ProductCompare.Repo.query(
      """
      INSERT INTO api_tokens (entropy_id, user_id, token_prefix, token_hash, label, inserted_at)
      VALUES ($1, $2, $3, $4, $5, now())
      """,
      [
        Ecto.UUID.dump!(Ecto.UUID.generate()),
        user_id,
        token_prefix,
        :binary.copy(<<hash_byte>>, 32),
        label
      ]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
