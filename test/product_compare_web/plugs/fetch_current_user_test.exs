defmodule ProductCompareWeb.Plugs.FetchCurrentUserTest do
  use ProductCompareWeb.ConnCase, async: true

  alias ProductCompareWeb.Plugs.FetchCurrentUser

  test "clears a present malformed session token", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{user_token: %{unexpected: "shape"}})
      |> FetchCurrentUser.call([])

    refute get_session(conn, :user_token)
  end
end
