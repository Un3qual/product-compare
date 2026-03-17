defmodule ProductCompare.Accounts.UserEmailTokenTest do
  use ProductCompare.DataCase, async: false

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

    test "reset_user_password/2 only allows one successful use of a reset token" do
      user = user_fixture(%{password: "supersecretpass123"})

      original_config =
        Application.get_env(:product_compare, ProductCompare.Accounts.UserAuth, [])

      parent = self()

      Application.put_env(
        :product_compare,
        ProductCompare.Accounts.UserAuth,
        Keyword.put(original_config, :before_reset_user_password_transaction, fn ->
          send(parent, {:before_reset_password_transaction, self()})

          receive do
            :continue -> :ok
          after
            1_000 -> raise "timed out waiting to resume reset_user_password/2"
          end
        end)
      )

      on_exit(fn ->
        Application.put_env(:product_compare, ProductCompare.Accounts.UserAuth, original_config)
      end)

      assert :ok =
               Accounts.deliver_user_reset_password_instructions(user, fn token ->
                 send(parent, {:reset_password_token, token})
               end)

      assert_receive {:reset_password_token, token}

      task_a =
        Task.async(fn ->
          receive do
            {:run, password} -> Accounts.reset_user_password(token, %{password: password})
          end
        end)

      task_b =
        Task.async(fn ->
          receive do
            {:run, password} -> Accounts.reset_user_password(token, %{password: password})
          end
        end)

      Ecto.Adapters.SQL.Sandbox.allow(Repo, self(), task_a.pid)
      Ecto.Adapters.SQL.Sandbox.allow(Repo, self(), task_b.pid)

      send(task_a.pid, {:run, "supersecretpass456"})
      send(task_b.pid, {:run, "supersecretpass789"})

      assert_receive {:before_reset_password_transaction, gate_a}
      assert_receive {:before_reset_password_transaction, gate_b}

      send(gate_a, :continue)
      send(gate_b, :continue)

      results = [Task.await(task_a), Task.await(task_b)]

      assert Enum.count(results, &match?({:ok, %User{}}, &1)) == 1
      assert Enum.count(results, &(&1 == {:error, :invalid_token})) == 1

      successful_passwords =
        ["supersecretpass456", "supersecretpass789"]
        |> Enum.filter(fn password ->
          match?(%User{}, Accounts.authenticate_user_by_email_and_password(user.email, password))
        end)

      assert length(successful_passwords) == 1
      assert is_nil(Accounts.get_user_by_reset_password_token(token))
    end

    test "reset_user_password/2 prevents stale pre-reset auth state from issuing a session" do
      user = user_fixture(%{password: "supersecretpass123"})
      user_email = user.email
      parent = self()

      assert %User{} =
               authenticated_user =
               Accounts.authenticate_user_by_email_and_password(user_email, "supersecretpass123")

      assert :ok =
               Accounts.deliver_user_reset_password_instructions(user, fn token ->
                 send(parent, {:reset_password_token, token})
               end)

      assert_receive {:reset_password_token, token}

      assert {:ok, %User{}} =
               Accounts.reset_user_password(token, %{password: "supersecretpass456"})

      assert is_nil(Accounts.generate_user_session_token(authenticated_user))

      assert is_nil(
               Accounts.authenticate_user_by_email_and_password(user_email, "supersecretpass123")
             )

      assert %User{} =
               Accounts.authenticate_user_by_email_and_password(user_email, "supersecretpass456")

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
