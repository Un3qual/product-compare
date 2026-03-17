defmodule ProductCompareWeb.RouterTest do
  use ProductCompareWeb.ConnCase, async: true

  test "legacy browser auth routes are not exposed", %{conn: conn} do
    for path <- [
          "/api/auth/forgot-password",
          "/api/auth/reset-password",
          "/api/auth/verify-email"
        ] do
      response_conn =
        conn
        |> recycle()
        |> post(path)

      assert response_conn.status == 404
    end
  end
end
