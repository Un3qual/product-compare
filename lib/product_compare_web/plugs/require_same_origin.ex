defmodule ProductCompareWeb.Plugs.RequireSameOrigin do
  @moduledoc """
  Rejects unsafe requests from untrusted origins on session-mutating endpoints.
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
    if trusted_request_origin?(conn) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> json(@invalid_origin_error)
      |> halt()
    end
  end

  def call(conn, _opts), do: conn

  @spec allowed_origins(Plug.Conn.t()) :: [String.t()]
  def allowed_origins(conn) do
    [expected_origin(conn) | configured_trusted_origins()]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  @spec same_origin_request?(Plug.Conn.t()) :: boolean()
  def same_origin_request?(conn), do: trusted_request_origin?(conn)

  @spec trusted_request_origin?(Plug.Conn.t()) :: boolean()
  def trusted_request_origin?(conn) do
    case request_origin(conn) do
      nil -> false
      request_origin -> request_origin in allowed_origins(conn)
    end
  end

  @spec request_origin(Plug.Conn.t()) :: String.t() | nil
  def request_origin(conn) do
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

  defp configured_trusted_origins do
    :product_compare
    |> Application.get_env(ProductCompareWeb.Endpoint, [])
    |> Keyword.get(:trusted_origins, [])
    |> List.wrap()
    |> Enum.flat_map(fn
      origin when is_binary(origin) ->
        origin
        |> String.split(",", trim: true)
        |> Enum.map(&String.trim/1)

      _other ->
        []
    end)
    |> Enum.map(&normalize_origin/1)
    |> Enum.reject(&is_nil/1)
  end

  defp expected_origin(conn) do
    scheme = forwarded_scheme(conn) || Atom.to_string(conn.scheme)
    {host, forwarded_host_port} = forwarded_host(conn, scheme)
    forwarded_port = forwarded_port(conn)

    %URI{
      scheme: scheme,
      host: host || conn.host,
      port: forwarded_port || forwarded_host_port || fallback_port(conn, scheme)
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

  defp forwarded_scheme(conn) do
    conn
    |> get_req_header("x-forwarded-proto")
    |> first_header_value()
  end

  defp forwarded_host(conn, scheme) do
    case conn
         |> get_req_header("x-forwarded-host")
         |> first_header_value() do
      nil ->
        {nil, nil}

      value ->
        uri = URI.parse("#{scheme}://#{value}")
        {uri.host, uri.port}
    end
  end

  defp forwarded_port(conn) do
    conn
    |> get_req_header("x-forwarded-port")
    |> first_header_value()
    |> parse_port()
  end

  defp first_header_value([]), do: nil

  defp first_header_value([value | _]) do
    value
    |> String.split(",", parts: 2)
    |> List.first()
    |> String.trim()
    |> case do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp parse_port(nil), do: nil

  defp parse_port(value) do
    case Integer.parse(value) do
      {port, ""} -> port
      _ -> nil
    end
  end

  defp fallback_port(conn, scheme) do
    if forwarded_scheme(conn) do
      default_port_for(scheme)
    else
      conn.port
    end
  end

  defp default_port_for("http"), do: 80
  defp default_port_for("https"), do: 443
  defp default_port_for(_scheme), do: nil

  defp normalize_default_port(%URI{scheme: "http", port: 80} = uri), do: %{uri | port: nil}
  defp normalize_default_port(%URI{scheme: "https", port: 443} = uri), do: %{uri | port: nil}
  defp normalize_default_port(uri), do: uri
end
