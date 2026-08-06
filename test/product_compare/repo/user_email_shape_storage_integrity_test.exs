defmodule ProductCompare.Repo.UserEmailShapeStorageIntegrityTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompareSchemas.Accounts.User

  @fixed_password_hash "a77c3e91b4d62f8e0c5a19d37f6b28e4d91f0c35a8b7e26d4f9a16c83e05b72f"
  @fixed_inserted_at ~U[2026-08-05 00:00:00.000000Z]
  @internal_unicode_separators ["\u2003", "\u2028", "\u2029"]
  @ascii_regex_whitespace [" ", "\t", "\n", "\v", "\f", "\r"]

  test "users reject an email without an at sign through the named storage constraint" do
    assert_check_violation(insert_user("not-an-email"), "users_email_shape_check")
  end

  test "Accounts validation accepts emails with internal Unicode separators" do
    for separator <- @internal_unicode_separators do
      email = "before#{separator}after@example.com"

      changeset =
        User.registration_changeset(%User{}, %{
          email: email,
          password: "supersecretpass123"
        })

      assert changeset.valid?
      assert Ecto.Changeset.get_change(changeset, :email) == email
    end
  end

  test "Accounts validation rejects emails with ASCII regex whitespace" do
    for whitespace <- @ascii_regex_whitespace do
      changeset =
        User.registration_changeset(%User{}, %{
          email: "before#{whitespace}after@example.com",
          password: "supersecretpass123"
        })

      refute changeset.valid?
      assert %{email: ["must have the @ sign and no spaces"]} = errors_on(changeset)
    end
  end

  test "users accept emails with internal Unicode separators through direct SQL" do
    for separator <- @internal_unicode_separators do
      assert {:ok, _result} = insert_user("before#{separator}after@example.com")
    end
  end

  test "users reject emails with ASCII regex whitespace through the named storage constraint" do
    for whitespace <- @ascii_regex_whitespace do
      assert_check_violation(
        insert_user("before#{whitespace}after@example.com"),
        "users_email_shape_check"
      )
    end
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
