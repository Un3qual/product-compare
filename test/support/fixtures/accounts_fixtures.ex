defmodule ProductCompare.Fixtures.AccountsFixtures do
  alias ProductCompare.Accounts

  @spec user_fixture(map()) :: ProductCompareSchemas.Accounts.User.t()
  def user_fixture(attrs \\ %{}) do
    email = Map.get(attrs, :email, "user-#{System.unique_integer([:positive])}@example.com")
    password = Map.get(attrs, :password, "supersecretpass123")

    {:ok, user} =
      attrs
      |> Map.put_new(:email, email)
      |> Map.put_new(:password, password)
      |> Accounts.create_user()

    user
  end
end
