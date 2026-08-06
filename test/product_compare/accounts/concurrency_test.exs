defmodule ProductCompare.Accounts.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_blocked_by: 2,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Accounts
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserSessionToken

  @first_transition_at ~U[2026-07-30 12:00:00.000000Z]

  test "operator locking requires a database transaction" do
    Sandbox.unboxed_run(Repo, fn ->
      assert_raise ArgumentError,
                   "lock_operator/1 requires a database transaction",
                   fn -> Accounts.lock_operator(0) end
    end)
  end

  test "operator locking reloads the current row and fails closed" do
    operator = AccountsFixtures.operator_fixture()
    member = AccountsFixtures.user_fixture()

    assert {:ok, {:ok, %User{id: operator_id, is_operator: true}}} =
             Repo.transaction(fn -> Accounts.lock_operator(operator.id) end)

    assert operator_id == operator.id

    assert {:ok, {:error, :forbidden}} =
             Repo.transaction(fn -> Accounts.lock_operator(member.id) end)

    assert {:ok, {:error, :forbidden}} =
             Repo.transaction(fn -> Accounts.lock_operator(0) end)

    assert {:ok, %User{is_operator: false}} = Accounts.set_operator_access(operator, false)

    assert {:ok, {:error, :forbidden}} =
             Repo.transaction(fn -> Accounts.lock_operator(operator.id) end)
  end

  test "API token revocation preserves the transition that wins the row lock" do
    fixture = committed_api_token_fixture()
    on_exit(fn -> delete_committed_user(fixture.user.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ApiToken, fixture.api_token.id, fn token ->
        token
        |> Ecto.Changeset.change(revoked_at: @first_transition_at)
        |> Repo.update!()
      end)

    {revocation, revocation_backend_pid} =
      start_unboxed_action(fn ->
        Accounts.revoke_api_token(fixture.user.id, fixture.api_token.entropy_id)
      end)

    assert_blocked_by(revocation_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, revoked} = Task.await(revocation)
    assert revoked.revoked_at == @first_transition_at
    assert Repo.get!(ApiToken, fixture.api_token.id).revoked_at == @first_transition_at
  end

  test "API token authentication cannot touch and return a concurrently revoked token" do
    fixture = committed_api_token_fixture()
    on_exit(fn -> delete_committed_user(fixture.user.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ApiToken, fixture.api_token.id, fn token ->
        token
        |> Ecto.Changeset.change(revoked_at: @first_transition_at)
        |> Repo.update!()
      end)

    {authentication, authentication_backend_pid} =
      start_unboxed_action(fn ->
        Accounts.authenticate_api_token(fixture.plain_text_token)
      end)

    assert_blocked_by(authentication_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert :error = Task.await(authentication)
    assert Repo.get!(ApiToken, fixture.api_token.id).last_used_at == nil
  end

  test "concurrent successful email deliveries activate exactly one replacement token" do
    user =
      Sandbox.unboxed_run(Repo, fn ->
        AccountsFixtures.user_fixture()
      end)

    on_exit(fn -> delete_committed_user(user.id) end)
    parent = self()

    deliveries =
      for label <- [:first, :second] do
        Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Accounts.deliver_user_reset_password_instructions(user, fn token ->
              send(parent, {:delivery_candidate, label, self(), token})

              receive do
                :finish_delivery -> :ok
              after
                5_000 -> flunk("timed out waiting to finish token delivery")
              end
            end)
          end)
        end)
      end

    assert_receive {:delivery_candidate, first_label, first_pid, first_token}, 2_000
    assert_receive {:delivery_candidate, second_label, second_pid, second_token}, 2_000
    assert MapSet.new([first_label, second_label]) == MapSet.new([:first, :second])

    send(first_pid, :finish_delivery)
    send(second_pid, :finish_delivery)
    assert Enum.map(deliveries, &Task.await/1) == [:ok, :ok]

    user_id = user.id

    active_tokens =
      Enum.filter([first_token, second_token], fn token ->
        match?(%User{id: ^user_id}, Accounts.get_user_by_reset_password_token(token))
      end)

    assert [_active_token] = active_tokens

    assert Repo.aggregate(
             from(token in UserSessionToken,
               where: token.user_id == ^user.id and token.context == :reset_password
             ),
             :count,
             :id
           ) == 1
  end

  defp committed_api_token_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      {:ok, %{api_token: api_token, plain_text_token: plain_text_token}} =
        Accounts.create_api_token(user.id, %{})

      %{api_token: api_token, plain_text_token: plain_text_token, user: user}
    end)
  end

  defp delete_committed_user(user_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from user in User, where: user.id == ^user_id)
    end)
  end
end
