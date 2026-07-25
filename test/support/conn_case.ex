defmodule ProductCompareWeb.ConnCase do
  @moduledoc """
  Connection tests receive an isolated SQL sandbox and a fresh Phoenix connection
  so HTTP behavior starts from the same state as production. The included helpers
  model the repository's session, API-token, and same-origin authentication contracts
  without duplicating setup in each test.
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

  def operator_conn(conn, auth_method \\ :session) do
    authenticated_conn(
      conn,
      ProductCompare.Fixtures.AccountsFixtures.operator_fixture(),
      auth_method
    )
  end

  def member_conn(conn, auth_method \\ :session) do
    authenticated_conn(
      conn,
      ProductCompare.Fixtures.AccountsFixtures.user_fixture(),
      auth_method
    )
  end

  def put_req_header_same_origin(conn) do
    [request_origin | _trusted_origins] =
      ProductCompareWeb.Plugs.RequireSameOrigin.allowed_origins(conn)

    Plug.Conn.put_req_header(conn, "origin", request_origin)
  end

  def relay_id(type, local_id) when is_atom(type) do
    ProductCompareWeb.GraphQL.GlobalId.encode(type, local_id)
  end

  defp authenticated_conn(conn, user, :session) do
    conn
    |> log_in_user(user)
    |> put_req_header_same_origin()
  end

  defp authenticated_conn(conn, user, :api_token) do
    {:ok, %{plain_text_token: token}} =
      ProductCompare.Accounts.create_api_token(user.id, %{label: "test authentication"})

    Plug.Conn.put_req_header(conn, "authorization", "Bearer #{token}")
  end
end
