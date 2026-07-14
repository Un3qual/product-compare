defmodule ProductCompare.Repo.SeedsTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation

  test "seeds stop rather than promote a preclaimed operator email" do
    attacker_password = String.duplicate("a", 16)

    assert {:ok, preclaimed} =
             Accounts.register_user(%{
               email: "admin@example.com",
               password: attacker_password
             })

    assert_raise RuntimeError, ~r/Refusing to bootstrap admin@example.com/, fn ->
      Code.eval_file("priv/repo/seeds.exs")
    end

    persisted = Repo.get!(User, preclaimed.id)
    refute persisted.is_operator
    assert persisted.hashed_password == preclaimed.hashed_password
    assert Argon2.verify_pass(attacker_password, persisted.hashed_password)
    refute Repo.get_by(UserReputation, user_id: preclaimed.id)
  end
end
