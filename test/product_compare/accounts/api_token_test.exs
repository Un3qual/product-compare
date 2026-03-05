defmodule ProductCompare.Accounts.ApiTokenTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Accounts
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.ApiToken
  import ProductCompare.Fixtures.AccountsFixtures

  setup do
    original_config = Application.get_env(:product_compare, Accounts)

    on_exit(fn ->
      case original_config do
        nil -> Application.delete_env(:product_compare, Accounts)
        config -> Application.put_env(:product_compare, Accounts, config)
      end
    end)

    :ok
  end

  describe "create_api_token/2" do
    test "stores only hashed token material and returns plaintext once" do
      user = user_fixture()

      assert {:ok, %{plain_text_token: plain_text_token, api_token: api_token}} =
               Accounts.create_api_token(user.id, %{label: "CLI"})

      assert is_binary(plain_text_token)
      assert byte_size(plain_text_token) > 20
      assert api_token.user_id == user.id
      assert api_token.label == "CLI"
      assert api_token.token_prefix == String.slice(plain_text_token, 0, 12)

      persisted = Repo.get!(ApiToken, api_token.id)

      assert persisted.token_hash == :crypto.hash(:sha3_256, plain_text_token)
      refute persisted.token_hash == plain_text_token
    end

    test "defaults token expiry to ninety days" do
      user = user_fixture()
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      assert {:ok, %{api_token: api_token}} = Accounts.create_api_token(user.id, %{})

      expected = 90 * 24 * 60 * 60
      delta = DateTime.diff(api_token.expires_at, now, :second)
      assert delta in (expected - 20)..(expected + 20)
    end

    test "uses configured default token ttl days" do
      Application.put_env(:product_compare, Accounts, api_token_default_ttl_days: 30)
      user = user_fixture()
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      assert {:ok, %{api_token: api_token}} = Accounts.create_api_token(user.id, %{})

      expected = 30 * 24 * 60 * 60
      delta = DateTime.diff(api_token.expires_at, now, :second)
      assert delta in (expected - 20)..(expected + 20)
    end

    test "falls back to safe default ttl when configured value is invalid" do
      Application.put_env(:product_compare, Accounts, api_token_default_ttl_days: 0)
      user = user_fixture()
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      assert {:ok, %{api_token: api_token}} = Accounts.create_api_token(user.id, %{})

      expected = 90 * 24 * 60 * 60
      delta = DateTime.diff(api_token.expires_at, now, :second)
      assert delta in (expected - 20)..(expected + 20)
    end
  end

  describe "authenticate_api_token/2" do
    test "returns user and touches last_used_at for active token" do
      user = user_fixture()

      assert {:ok, %{plain_text_token: plain_text_token, api_token: api_token}} =
               Accounts.create_api_token(user.id, %{})

      assert is_nil(api_token.last_used_at)

      assert {:ok, authed_user, authed_token} = Accounts.authenticate_api_token(plain_text_token)
      assert authed_user.id == user.id
      assert authed_token.id == api_token.id

      persisted = Repo.get!(ApiToken, api_token.id)
      refute is_nil(persisted.last_used_at)
    end

    test "rejects revoked and expired tokens" do
      user = user_fixture()

      assert {:ok, %{plain_text_token: revokable_token, api_token: revokable}} =
               Accounts.create_api_token(user.id, %{})

      assert {:ok, _revoked} = Accounts.revoke_api_token(user.id, revokable.entropy_id)
      assert :error = Accounts.authenticate_api_token(revokable_token)

      expired_at =
        DateTime.add(DateTime.utc_now(), -60, :second) |> DateTime.truncate(:microsecond)

      assert {:ok, %{plain_text_token: expired_token}} =
               Accounts.create_api_token(user.id, %{expires_at: expired_at})

      assert :error = Accounts.authenticate_api_token(expired_token)
    end
  end

  describe "revoke_api_token/2" do
    test "returns not_found when token is owned by another user" do
      owner = user_fixture()
      other_user = user_fixture()

      assert {:ok, %{api_token: api_token}} = Accounts.create_api_token(owner.id, %{})

      assert {:error, :not_found} = Accounts.revoke_api_token(other_user.id, api_token.entropy_id)
    end
  end

  describe "rotate_api_token/3" do
    test "revokes the old token and issues a replacement token" do
      user = user_fixture()

      assert {:ok, %{plain_text_token: old_plain_text_token, api_token: old_token}} =
               Accounts.create_api_token(user.id, %{label: "old-token"})

      assert {:ok,
              %{
                plain_text_token: new_plain_text_token,
                api_token: new_token,
                revoked_api_token: revoked_token
              }} =
               Accounts.rotate_api_token(user.id, old_token.entropy_id, %{label: "rotated-token"})

      assert revoked_token.id == old_token.id
      refute is_nil(revoked_token.revoked_at)
      assert new_token.id != old_token.id
      assert new_token.label == "rotated-token"

      assert :error = Accounts.authenticate_api_token(old_plain_text_token)

      assert {:ok, authed_user, authed_token} =
               Accounts.authenticate_api_token(new_plain_text_token)

      assert authed_user.id == user.id
      assert authed_token.id == new_token.id
    end

    test "returns not_found when token is owned by another user" do
      owner = user_fixture()
      other_user = user_fixture()

      assert {:ok, %{api_token: api_token}} = Accounts.create_api_token(owner.id, %{})

      assert {:error, :not_found} =
               Accounts.rotate_api_token(other_user.id, api_token.entropy_id, %{})
    end
  end

  describe "list_api_tokens/2" do
    test "supports all, active, and revoked filters" do
      user = user_fixture()

      assert {:ok, %{api_token: active_token}} =
               Accounts.create_api_token(user.id, %{label: "active"})

      assert {:ok, %{api_token: revoked_token}} =
               Accounts.create_api_token(user.id, %{label: "revoked"})

      assert {:ok, _revoked} = Accounts.revoke_api_token(user.id, revoked_token.entropy_id)

      expired_at =
        DateTime.utc_now()
        |> DateTime.add(-60, :second)
        |> DateTime.truncate(:microsecond)

      assert {:ok, %{api_token: expired_token}} =
               Accounts.create_api_token(user.id, %{label: "expired", expires_at: expired_at})

      all_ids = Enum.map(Accounts.list_api_tokens(user.id, status: :all), & &1.id)
      assert all_ids == [expired_token.id, revoked_token.id, active_token.id]

      active_ids = Enum.map(Accounts.list_api_tokens(user.id, status: :active), & &1.id)
      assert active_ids == [active_token.id]

      revoked_ids = Enum.map(Accounts.list_api_tokens(user.id, status: :revoked), & &1.id)
      assert revoked_ids == [revoked_token.id]

      assert Enum.map(Accounts.list_api_tokens(user.id, status: :unknown), & &1.id) == all_ids
      assert Enum.map(Accounts.list_api_tokens(user.id), & &1.id) == all_ids
    end
  end
end
