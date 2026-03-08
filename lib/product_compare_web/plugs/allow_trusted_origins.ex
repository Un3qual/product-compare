defmodule ProductCompareWeb.Plugs.AllowTrustedOrigins do
  @moduledoc """
  Adds credentialed CORS headers for configured trusted frontend origins.
  """

  import Plug.Conn

  alias ProductCompareWeb.Plugs.RequireSameOrigin

  @behaviour Plug

  @allow_methods "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  @default_allow_headers "authorization,content-type"

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    case RequireSameOrigin.request_origin(conn) do
      origin when is_binary(origin) ->
        if origin in RequireSameOrigin.allowed_origins(conn) do
          conn
          |> put_resp_header("access-control-allow-origin", origin)
          |> put_resp_header("access-control-allow-credentials", "true")
          |> put_resp_header("vary", vary_header(conn))
          |> maybe_put_preflight_headers()
        else
          conn
        end

      _ ->
        conn
    end
  end

  defp maybe_put_preflight_headers(%Plug.Conn{method: "OPTIONS"} = conn) do
    conn
    |> put_resp_header("access-control-allow-methods", @allow_methods)
    |> put_resp_header("access-control-allow-headers", allow_headers(conn))
  end

  defp maybe_put_preflight_headers(conn), do: conn

  defp allow_headers(conn) do
    conn
    |> get_req_header("access-control-request-headers")
    |> List.first()
    |> case do
      nil -> @default_allow_headers
      "" -> @default_allow_headers
      headers -> headers
    end
  end

  defp vary_header(%Plug.Conn{method: "OPTIONS"}), do: "Origin, Access-Control-Request-Headers"
  defp vary_header(_conn), do: "Origin"
end
