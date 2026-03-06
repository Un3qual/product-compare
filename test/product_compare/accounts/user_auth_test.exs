defmodule ProductCompare.Accounts.UserAuthTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.UserSessionToken
  import ProductCompare.Fixtures.AccountsFixtures

  describe "authenticate_user_by_email_and_password/2" do
    test "returns user for valid credentials" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_id = user.id

      assert %ProductCompareSchemas.Accounts.User{id: ^user_id} =
               Accounts.authenticate_user_by_email_and_password(
                 user.email,
                 "supersecretpass123"
               )
    end

    test "returns nil for invalid credentials" do
      user = user_fixture(%{password: "supersecretpass123"})

      assert is_nil(
               Accounts.authenticate_user_by_email_and_password(user.email, "wrong-password-123")
             )

      assert is_nil(
               Accounts.authenticate_user_by_email_and_password(
                 "missing-#{System.unique_integer([:positive])}@example.com",
                 "supersecretpass123"
               )
             )
    end

    test "returns nil (without raising) when stored hash is not an argon hash" do
      email = "non-argon-#{System.unique_integer([:positive])}@example.com"

      assert {:ok, _user} = Accounts.create_user(%{email: email})

      assert is_nil(Accounts.authenticate_user_by_email_and_password(email, "any-password-value"))
    end
  end

  describe "user session tokens" do
    test "creates, resolves, and deletes a user session token" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_id = user.id

      token = Accounts.generate_user_session_token(user)
      assert is_binary(token)
      assert token != ""

      assert %ProductCompareSchemas.Accounts.User{id: ^user_id} =
               Accounts.get_user_by_session_token(token)

      assert %UserSessionToken{} =
               Repo.get_by!(UserSessionToken, context: "session", user_id: user.id)

      assert :ok = Accounts.delete_user_session_token(token)
      assert is_nil(Accounts.get_user_by_session_token(token))
      assert Repo.aggregate(UserSessionToken, :count, :id) == 0
    end
  end
end
