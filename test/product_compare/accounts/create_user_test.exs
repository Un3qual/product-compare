defmodule ProductCompare.Accounts.CreateUserTest do
  use ProductCompare.DataCase, async: true

  alias Ecto.Adapters.SQL
  alias ProductCompare.Accounts
  alias ProductCompare.Repo

  describe "create_user/1" do
    test "persists a non-null hashed_password when caller omits it" do
      assert {:ok, user} =
               Accounts.create_user(%{
                 email: "create-user-#{System.unique_integer([:positive])}@example.com"
               })

      assert %Postgrex.Result{rows: [[hashed_password]]} =
               SQL.query!(Repo, "SELECT hashed_password FROM users WHERE id = $1", [user.id])

      assert is_binary(hashed_password)
      assert hashed_password != ""
    end
  end
end
