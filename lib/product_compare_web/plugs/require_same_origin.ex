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
    url_config = endpoint_url_config()
    scheme = Keyword.get(url_config, :scheme, Atom.to_string(conn.scheme))
    port = Keyword.get(url_config, :port, conn.port)

    format_origin(scheme, conn.host, port)
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

      %URI{scheme: scheme, host: host, port: port} ->
        format_origin(scheme, host, port)
    end
  end

  defp endpoint_url_config do
    :product_compare
    |> Application.get_env(ProductCompareWeb.Endpoint, [])
    |> Keyword.get(:url, [])
  end

  defp format_origin(scheme, host, port) do
    host = if String.contains?(host, ":"), do: "[#{host}]", else: host
    port = if URI.default_port(scheme) == port, do: nil, else: port
    port_suffix = if port, do: ":#{port}", else: ""

    "#{scheme}://#{host}#{port_suffix}"
  end
end
