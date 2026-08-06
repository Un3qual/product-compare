defmodule ProductCompare.Repo.UserEmailShapeStorageIntegrityTest do
  use ProductCompare.DataCase, async: true

  @fixed_password_hash "a77c3e91b4d62f8e0c5a19d37f6b28e4d91f0c35a8b7e26d4f9a16c83e05b72f"
  @fixed_inserted_at ~U[2026-08-05 00:00:00.000000Z]

  test "users reject an email without an at sign through the named storage constraint" do
    assert_check_violation(insert_user("not-an-email"), "users_email_shape_check")
  end

  test "users reject an email containing whitespace through the named storage constraint" do
    assert_check_violation(insert_user("has space@example.com"), "users_email_shape_check")
  end

  test "users accept a non-whitespace email containing an at sign through direct SQL" do
    assert {:ok, _result} = insert_user("valid@example.com")
  end

  defp insert_user(email) do
    ProductCompare.Repo.query(
      """
      INSERT INTO users (email, hashed_password, inserted_at)
      VALUES ($1, $2, $3)
      """,
      [email, @fixed_password_hash, @fixed_inserted_at]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
