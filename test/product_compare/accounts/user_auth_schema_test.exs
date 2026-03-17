defmodule ProductCompare.Accounts.UserAuthSchemaTest do
  use ProductCompare.DataCase, async: false

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

  test "registration changeset trims and normalizes email and hashes password" do
    password = "supersecretpass123"

    changeset =
      User.registration_changeset(%User{}, %{email: " UPPER@Example.com ", password: password})

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
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    assert {1, [%{id: legacy_user_id}]} =
             Repo.insert_all(
               User,
               [%{email: email, hashed_password: placeholder_hash, inserted_at: now}],
               returning: [:id]
             )

    legacy_user = Repo.get!(User, legacy_user_id)

    assert legacy_user.hashed_password == placeholder_hash

    assert {:ok, repaired_user} =
             Accounts.ensure_user_with_password("  LEGACY@EXAMPLE.COM  ", password)

    persisted_user = Repo.get!(User, legacy_user.id)

    assert repaired_user.id == legacy_user.id
    assert repaired_user.hashed_password == persisted_user.hashed_password
    assert is_binary(persisted_user.hashed_password)
    assert persisted_user.hashed_password != placeholder_hash
    assert String.starts_with?(persisted_user.hashed_password, "$argon2")
    assert Argon2.verify_pass(password, persisted_user.hashed_password)
  end

  test "ensure_user_with_password creates missing users" do
    password = "supersecretpass123"
    email = "  NEW_USER@example.com  "

    assert {:ok, user} = Accounts.ensure_user_with_password(email, password)

    assert user.email == "new_user@example.com"
    assert is_binary(user.hashed_password)
    assert Argon2.verify_pass(password, user.hashed_password)
  end

  test "ensure_user_with_password rejects blank passwords" do
    email = "blank-password@example.com"

    assert {:error, changeset} = Accounts.ensure_user_with_password(email, "")
    assert %{password: ["can't be blank"]} = errors_on(changeset)
  end

  test "ensure_user_with_password can continue after a unique-email insert failure" do
    password = "supersecretpass123"
    normalized_email = "race-user-#{System.unique_integer([:positive])}@example.com"
    email = "  #{normalized_email}  "
    placeholder_hash = String.duplicate("a", 64)
    original_config = Application.get_env(:product_compare, Accounts, [])
    parent = self()

    Application.put_env(
      :product_compare,
      Accounts,
      Keyword.put(original_config, :ensure_user_with_password_before_create, fn hooked_email ->
        send(parent, {:before_create, hooked_email, self()})

        receive do
          :continue_create -> :ok
        after
          1_000 -> flunk("timed out waiting to resume create_user")
        end
      end)
    )

    on_exit(fn ->
      Application.put_env(:product_compare, Accounts, original_config)
    end)

    task =
      Task.async(fn ->
        receive do
          :start -> Accounts.ensure_user_with_password(email, password)
        end
      end)

    Ecto.Adapters.SQL.Sandbox.allow(Repo, self(), task.pid)
    send(task.pid, :start)

    assert_receive {:before_create, ^normalized_email, hook_pid}

    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    assert {1, [%{id: user_id}]} =
             Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
               Repo.insert_all(
                 User,
                 [
                   %{email: normalized_email, hashed_password: placeholder_hash, inserted_at: now}
                 ],
                 returning: [:id]
               )
             end)

    send(hook_pid, :continue_create)

    assert {:ok, %User{id: ^user_id} = user} = Task.await(task)

    assert 1 ==
             Repo.aggregate(
               from(user in User, where: user.email == ^normalized_email),
               :count,
               :id
             )

    assert %User{id: ^user_id} = Accounts.get_user_by_email(email)
    refute user.hashed_password == placeholder_hash
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
    persisted_user = Repo.get!(User, legacy_user.id)

    assert repaired_user.id == legacy_user.id
    assert repaired_user.hashed_password == persisted_user.hashed_password
    assert is_binary(persisted_user.hashed_password)
    assert persisted_user.hashed_password != ""
    assert Argon2.verify_pass(password, persisted_user.hashed_password)
  end
end
