defmodule ProductCompare.ComparisonSnapshots.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_some_backend_blocked_by: 1,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  @first_transition_at ~U[2026-07-30 12:00:00.000000Z]

  test "snapshot revocation cannot reclaim an already committed active transition" do
    fixture = committed_snapshot_fixture()
    on_exit(fn -> delete_committed_user(fixture.user.id) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(ComparisonSnapshot, fixture.snapshot.id, fn snapshot ->
        snapshot
        |> ComparisonSnapshot.revoke_changeset(@first_transition_at)
        |> Repo.update!()
      end)

    {revocation, _revocation_backend_pid} =
      start_unboxed_action(fn ->
        ComparisonSnapshots.revoke(
          fixture.user.id,
          fixture.snapshot.entropy_id,
          now: DateTime.add(@first_transition_at, 1, :second)
        )
      end)

    assert_some_backend_blocked_by(lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:error, :not_found} = Task.await(revocation)
    assert Repo.get!(ComparisonSnapshot, fixture.snapshot.id).revoked_at == @first_transition_at
  end

  defp committed_snapshot_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      snapshot =
        %ComparisonSnapshot{}
        |> ComparisonSnapshot.publish_changeset(%{
          public_token: 32 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false),
          user_id: user.id,
          version: 1,
          captured_at: @first_transition_at
        })
        |> Repo.insert!()

      %{snapshot: Repo.get!(ComparisonSnapshot, snapshot.id), user: user}
    end)
  end

  defp delete_committed_user(user_id) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from user in User, where: user.id == ^user_id)
    end)
  end
end
