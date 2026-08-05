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

  test "api_tokens rejects a 33-character token prefix with its named storage constraint" do
    user = user_fixture()

    assert_check_violation(
      insert_api_token(user.id, String.duplicate("a", 33), nil, 3),
      "api_tokens_prefix_length_check"
    )
  end

  test "api_tokens rejects a 121-character label with its named storage constraint" do
    user = user_fixture()

    assert_check_violation(
      insert_api_token(user.id, "a", String.duplicate("b", 121), 4),
      "api_tokens_label_length_check"
    )
  end

  test "credential artifacts accept their valid storage boundaries" do
    user = user_fixture()

    assert {:ok, _result} = insert_user_token(user.id, :binary.copy(<<1>>, 32))
    assert {:ok, _result} = insert_api_token(user.id, "a", nil, 2)

    assert {:ok, _result} =
             insert_api_token(user.id, String.duplicate("a", 32), String.duplicate("b", 120), 3)
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
