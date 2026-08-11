defmodule ProductCompareWeb.Plugs.PutAnonymousVisitorTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.AnonymousVisitor
  alias ProductCompareWeb.Endpoint
  alias ProductCompareWeb.Plugs.PutAnonymousVisitor

  @cookie_name "_product_compare_visitor"

  test "sets a signed HTTP-only SameSite cookie without creating a visitor row", %{conn: conn} do
    conn =
      conn |> with_secret_key_base() |> PutAnonymousVisitor.call(PutAnonymousVisitor.init([]))

    assert {:ok, _entropy_id} = Ecto.UUID.cast(conn.assigns.anonymous_visitor_entropy_id)
    assert Repo.aggregate(AnonymousVisitor, :count, :id) == 0

    assert %{http_only: true, same_site: "Lax", max_age: 31_536_000} =
             conn.resp_cookies[@cookie_name]
  end

  test "reuses a valid signed cookie and replaces a forged cookie", %{conn: conn} do
    first =
      conn
      |> with_secret_key_base()
      |> PutAnonymousVisitor.call([])
      |> Plug.Conn.send_resp(200, "")

    entropy_id = first.assigns.anonymous_visitor_entropy_id

    reused =
      first
      |> Phoenix.ConnTest.recycle()
      |> with_secret_key_base()
      |> PutAnonymousVisitor.call([])

    assert reused.assigns.anonymous_visitor_entropy_id == entropy_id

    replaced =
      Phoenix.ConnTest.build_conn()
      |> with_secret_key_base()
      |> Phoenix.ConnTest.put_req_cookie(@cookie_name, "forged")
      |> PutAnonymousVisitor.call([])

    assert {:ok, replacement} = Ecto.UUID.cast(replaced.assigns.anonymous_visitor_entropy_id)
    refute replacement == entropy_id
  end

  test "uses the endpoint secure-cookie policy", %{conn: conn} do
    previous = Application.get_env(:product_compare, Endpoint, [])

    Application.put_env(
      :product_compare,
      Endpoint,
      Keyword.put(previous, :session_options, secure: true)
    )

    on_exit(fn -> Application.put_env(:product_compare, Endpoint, previous) end)

    conn = conn |> with_secret_key_base() |> PutAnonymousVisitor.call([])

    assert conn.resp_cookies[@cookie_name].secure
  end

  defp with_secret_key_base(conn) do
    endpoint_config = Application.fetch_env!(:product_compare, Endpoint)
    Map.put(conn, :secret_key_base, Keyword.fetch!(endpoint_config, :secret_key_base))
  end
end
