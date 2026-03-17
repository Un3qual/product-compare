defmodule ProductCompare.Accounts.UserEmailTokenTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken
  import ProductCompare.Fixtures.AccountsFixtures

  describe "password reset tokens" do
    test "delivers a reset password token that resolves back to the user" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_id = user.id
      parent = self()

      assert :ok =
               Accounts.deliver_user_reset_password_instructions(user, fn token ->
                 send(parent, {:reset_password_token, token})
               end)

      assert_receive {:reset_password_token, token}
      assert %User{id: ^user_id} = Accounts.get_user_by_reset_password_token(token)
    end

    test "reset_user_password/2 updates the password and clears all user tokens" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_id = user.id
      parent = self()
      session_token = Accounts.generate_user_session_token(user)

      assert :ok =
               Accounts.deliver_user_reset_password_instructions(user, fn token ->
                 send(parent, {:reset_password_token, token})
               end)

      assert_receive {:reset_password_token, token}

      assert {:ok, %User{id: ^user_id} = updated_user} =
               Accounts.reset_user_password(token, %{password: "supersecretpass456"})

      assert Argon2.verify_pass("supersecretpass456", updated_user.hashed_password)

      assert is_nil(
               Accounts.authenticate_user_by_email_and_password(user.email, "supersecretpass123")
             )

      assert %User{id: ^user_id} =
               Accounts.authenticate_user_by_email_and_password(user.email, "supersecretpass456")

      assert is_nil(Accounts.get_user_by_session_token(session_token))
      assert is_nil(Accounts.get_user_by_reset_password_token(token))
      assert Repo.aggregate(UserSessionToken, :count, :id) == 0
    end
  end

  describe "confirmation tokens" do
    test "delivers a confirmation token that confirms the user" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_id = user.id
      parent = self()

      assert :ok =
               Accounts.deliver_user_confirmation_instructions(user, fn token ->
                 send(parent, {:confirmation_token, token})
               end)

      assert_receive {:confirmation_token, token}
      assert {:ok, %User{id: ^user_id, confirmed_at: confirmed_at}} = Accounts.confirm_user(token)
      refute is_nil(confirmed_at)

      assert %User{id: ^user_id, confirmed_at: persisted_confirmed_at} = Repo.get!(User, user.id)
      refute is_nil(persisted_confirmed_at)
      assert Repo.aggregate(UserSessionToken, :count, :id) == 0
    end

    test "confirm_user/1 rejects an invalid token" do
      assert {:error, :invalid_token} = Accounts.confirm_user("definitely-invalid-token")
    end
  end
end
