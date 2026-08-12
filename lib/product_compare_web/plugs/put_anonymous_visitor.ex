defmodule ProductCompareWeb.Plugs.PutAnonymousVisitor do
  @moduledoc false

  import Plug.Conn

  alias ProductCompareWeb.Endpoint

  @behaviour Plug

  @cookie_name "_product_compare_visitor"
  @cookie_max_age 60 * 60 * 24 * 365

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    conn = fetch_cookies(conn, signed: [@cookie_name])
    entropy_id = valid_entropy_id(conn.cookies[@cookie_name]) || Ecto.UUID.generate()

    conn
    |> assign(:anonymous_visitor_entropy_id, entropy_id)
    |> put_resp_cookie(@cookie_name, entropy_id,
      sign: true,
      http_only: true,
      same_site: "Lax",
      max_age: @cookie_max_age,
      secure: Keyword.get(Endpoint.session_options(), :secure, false)
    )
  end

  defp valid_entropy_id(value) when is_binary(value) do
    case Ecto.UUID.cast(value) do
      {:ok, entropy_id} -> entropy_id
      :error -> nil
    end
  end

  defp valid_entropy_id(_value), do: nil
end
