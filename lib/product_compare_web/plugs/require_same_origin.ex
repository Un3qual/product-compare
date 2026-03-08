defmodule ProductCompareWeb.Plugs.RequireSameOrigin do
  @moduledoc """
  Rejects unsafe cross-origin requests on session-mutating endpoints.
  """

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  @behaviour Plug

  @invalid_origin_error %{
    errors: [
      %{
        code: "INVALID_ORIGIN",
        message: "cross-origin request rejected"
      }
    ]
  }

  @unsafe_methods ~w(POST PUT PATCH DELETE)

  @impl Plug
  @spec init(term()) :: term()
  def init(opts), do: opts

  @impl Plug
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(%Plug.Conn{method: method} = conn, _opts) when method in @unsafe_methods do
    if same_origin_request?(conn) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> json(@invalid_origin_error)
      |> halt()
    end
  end

  def call(conn, _opts), do: conn

  defp same_origin_request?(conn) do
    case request_origin(conn) do
      nil -> false
      request_origin -> request_origin == expected_origin(conn)
    end
  end

  defp request_origin(conn) do
    conn
    |> get_req_header("origin")
    |> List.first()
    |> normalize_origin()
    |> case do
      nil ->
        conn
        |> get_req_header("referer")
        |> List.first()
        |> normalize_origin()

      origin ->
        origin
    end
  end

  defp expected_origin(conn) do
    %URI{
      scheme: Atom.to_string(conn.scheme),
      host: conn.host,
      port: conn.port
    }
    |> normalize_default_port()
    |> URI.to_string()
  end

  defp normalize_origin(nil), do: nil

  defp normalize_origin(value) do
    value
    |> URI.parse()
    |> case do
      %URI{scheme: nil} ->
        nil

      %URI{host: nil} ->
        nil

      uri ->
        uri
        |> Map.put(:path, nil)
        |> Map.put(:query, nil)
        |> Map.put(:fragment, nil)
        |> Map.put(:userinfo, nil)
        |> normalize_default_port()
        |> URI.to_string()
    end
  end

  defp normalize_default_port(%URI{scheme: "http", port: 80} = uri), do: %{uri | port: nil}
  defp normalize_default_port(%URI{scheme: "https", port: 443} = uri), do: %{uri | port: nil}
  defp normalize_default_port(uri), do: uri
end
