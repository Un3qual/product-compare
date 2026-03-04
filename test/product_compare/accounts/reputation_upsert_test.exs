defmodule ProductCompare.Accounts.ReputationUpsertTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Accounts
  import ProductCompare.Fixtures.AccountsFixtures

  describe "upsert_user_reputation/2" do
    test "inserts then updates points for the same user" do
      user = user_fixture()

      assert {:ok, reputation} = Accounts.upsert_user_reputation(user.id, 100)
      assert reputation.points == 100

      assert {:ok, updated_reputation} = Accounts.upsert_user_reputation(user.id, 250)
      assert updated_reputation.id == reputation.id
      assert updated_reputation.points == 250
      assert updated_reputation.inserted_at == reputation.inserted_at
    end
  end
end
