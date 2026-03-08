defmodule ProductCompareWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use ProductCompareWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint ProductCompareWeb.Endpoint

      use ProductCompareWeb, :verified_routes

      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import ProductCompareWeb.ConnCase
    end
  end

  setup tags do
    ProductCompare.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  def log_in_user(conn, user) do
    user_token = ProductCompare.Accounts.generate_user_session_token(user)

    conn
    |> Phoenix.ConnTest.init_test_session(%{})
    |> Plug.Conn.put_session(:user_token, user_token)
  end

  def put_req_header_same_origin(conn) do
    Plug.Conn.put_req_header(conn, "origin", request_origin(conn))
  end

  defp request_origin(conn) do
    scheme = Atom.to_string(conn.scheme)

    %URI{scheme: scheme, host: conn.host, port: normalize_port(conn.scheme, conn.port)}
    |> URI.to_string()
  end

  defp normalize_port(:http, 80), do: nil
  defp normalize_port(:https, 443), do: nil
  defp normalize_port(_scheme, port), do: port
end
