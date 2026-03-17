defmodule ProductCompare.Accounts.UserSessionTokenSchemaTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.UserSessionToken
  import ProductCompare.Fixtures.AccountsFixtures

  test "changeset validates required fields" do
    changeset = UserSessionToken.changeset(%UserSessionToken{}, %{})

    refute changeset.valid?

    assert %{
             user_id: ["can't be blank"],
             token_hash: ["can't be blank"],
             context: ["can't be blank"],
             expires_at: ["can't be blank"]
           } = errors_on(changeset)
  end

  test "reads database-generated id after insert" do
    user = user_fixture()
    token_hash = :crypto.strong_rand_bytes(32)

    expires_at =
      DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:microsecond)

    assert {:ok, token} =
             %UserSessionToken{}
             |> UserSessionToken.changeset(%{
               user_id: user.id,
               token_hash: token_hash,
               context: "session",
               expires_at: expires_at
             })
             |> Repo.insert()

    assert is_binary(token.id)
    assert token.id != ""
  end

  test "changeset enforces foreign key constraint for user_id" do
    token_hash = :crypto.strong_rand_bytes(32)

    expires_at =
      DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:microsecond)

    assert {:error, changeset} =
             %UserSessionToken{}
             |> UserSessionToken.changeset(%{
               user_id: 9_999_999_999,
               token_hash: token_hash,
               context: "session",
               expires_at: expires_at
             })
             |> Repo.insert()

    assert %{user_id: ["does not exist"]} = errors_on(changeset)
  end

  test "changeset enforces unique token hash per context" do
    user = user_fixture()
    token_hash = :crypto.strong_rand_bytes(32)

    expires_at =
      DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:microsecond)

    attrs = %{
      user_id: user.id,
      token_hash: token_hash,
      context: "session",
      expires_at: expires_at
    }

    assert {:ok, _token} =
             %UserSessionToken{}
             |> UserSessionToken.changeset(attrs)
             |> Repo.insert()

    assert {:error, changeset} =
             %UserSessionToken{}
             |> UserSessionToken.changeset(attrs)
             |> Repo.insert()

    assert %{token_hash: ["has already been taken"]} = errors_on(changeset)
  end
end
