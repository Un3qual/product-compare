defmodule ProductCompare.Accounts.UserAuthSchemaTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User

  test "registration changeset enforces minimum password length" do
    changeset = User.registration_changeset(%User{}, %{email: "a@example.com", password: "short"})

    refute changeset.valid?
    assert %{password: ["should be at least 12 character(s)"]} = errors_on(changeset)
  end

  test "registration changeset enforces maximum password length" do
    long_password = String.duplicate("a", 73)

    changeset =
      User.registration_changeset(%User{}, %{email: "a@example.com", password: long_password})

    refute changeset.valid?
    assert %{password: ["should be at most 72 character(s)"]} = errors_on(changeset)
  end

  test "registration changeset normalizes email and hashes password" do
    password = "supersecretpass123"

    changeset =
      User.registration_changeset(%User{}, %{email: "UPPER@Example.com", password: password})

    assert changeset.valid?
    assert Ecto.Changeset.get_change(changeset, :email) == "upper@example.com"

    hashed_password = Ecto.Changeset.get_change(changeset, :hashed_password)

    assert is_binary(hashed_password)
    refute hashed_password == password
    assert Argon2.verify_pass(password, hashed_password)
  end

  test "schema redacts both password fields" do
    assert :password in User.__schema__(:redact_fields)
    assert :hashed_password in User.__schema__(:redact_fields)
  end

  test "ensure_user_with_password updates users with non-argon2 placeholder hashes" do
    email = "legacy@example.com"
    password = "supersecretpass123"
    placeholder_hash = String.duplicate("a", 64)

    assert {:ok, legacy_user} =
             %User{}
             |> User.changeset(%{email: email, hashed_password: placeholder_hash})
             |> Repo.insert()

    assert legacy_user.hashed_password == placeholder_hash

    assert {:ok, repaired_user} = Accounts.ensure_user_with_password(email, password)

    assert repaired_user.id == legacy_user.id
    assert is_binary(repaired_user.hashed_password)
    assert repaired_user.hashed_password != placeholder_hash
    assert String.starts_with?(repaired_user.hashed_password, "$argon2")
    assert Argon2.verify_pass(password, repaired_user.hashed_password)
  end

  test "ensure_user_with_password creates missing users" do
    password = "supersecretpass123"
    email = "NEW_USER@example.com"

    assert {:ok, user} = Accounts.ensure_user_with_password(email, password)

    assert user.email == "new_user@example.com"
    assert is_binary(user.hashed_password)
    assert Argon2.verify_pass(password, user.hashed_password)
  end

  test "ensure_user_with_password does not rehash users that already have a password hash" do
    original_password = "supersecretpass123"
    attempted_replacement = "differentpassword456"
    email = "existing@example.com"

    assert {:ok, existing_user} =
             Accounts.create_user(%{email: email, password: original_password})

    original_hash = existing_user.hashed_password

    assert {:ok, user_after_ensure} =
             Accounts.ensure_user_with_password(email, attempted_replacement)

    assert user_after_ensure.id == existing_user.id
    assert user_after_ensure.hashed_password == original_hash
    assert Argon2.verify_pass(original_password, user_after_ensure.hashed_password)
    refute Argon2.verify_pass(attempted_replacement, user_after_ensure.hashed_password)
  end

  test "ensure_user_with_password repairs users with empty-string password hashes" do
    email = "legacy-empty@example.com"
    password = "supersecretpass123"
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    assert {1, [%{id: legacy_user_id}]} =
             Repo.insert_all(
               User,
               [%{email: email, hashed_password: "", inserted_at: now}],
               returning: [:id]
             )

    legacy_user = Repo.get!(User, legacy_user_id)

    assert {:ok, repaired_user} = Accounts.ensure_user_with_password(email, password)

    assert repaired_user.id == legacy_user.id
    assert is_binary(repaired_user.hashed_password)
    assert repaired_user.hashed_password != ""
    assert Argon2.verify_pass(password, repaired_user.hashed_password)
  end
end
