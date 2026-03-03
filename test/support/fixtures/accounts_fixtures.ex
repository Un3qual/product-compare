defmodule ProductCompare.Fixtures.AccountsFixtures do
  alias ProductCompare.Accounts

  @spec user_fixture(map()) :: ProductCompareSchemas.Accounts.User.t()
  def user_fixture(attrs \\ %{}) do
    email = Map.get(attrs, :email, "user-#{System.unique_integer([:positive])}@example.com")

    {:ok, user} =
      attrs
      |> Map.put_new(:email, email)
      |> Accounts.create_user()

    user
  end
end
