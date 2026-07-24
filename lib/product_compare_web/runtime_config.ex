defmodule ProductCompareWeb.RuntimeConfig do
  @moduledoc false

  @dev_trusted_origins ["http://127.0.0.1:5173", "http://localhost:5173"]

  @spec endpoint_host(String.t() | nil) :: String.t()
  def endpoint_host(phx_host) do
    normalize_host(phx_host) || "example.com"
  end

  @spec default_trusted_origins(atom(), String.t() | nil) :: [String.t()]
  def default_trusted_origins(:prod, phx_host) do
    [frontend_origin(endpoint_host(phx_host))]
  end

  def default_trusted_origins(_env, _phx_host), do: @dev_trusted_origins

  @spec public_site_url!(String.t() | nil) :: String.t()
  def public_site_url!(explicit_url) do
    with value when is_binary(value) <- explicit_url,
         trimmed when trimmed != "" <- String.trim(value),
         %URI{} = uri <- URI.parse(trimmed),
         true <- public_origin?(uri) do
      uri
      |> Map.put(:path, nil)
      |> URI.to_string()
    else
      _invalid ->
        raise ArgumentError,
              "PUBLIC_SITE_URL must be an absolute HTTP(S) origin without a path, query, or fragment"
    end
  end

  defp frontend_origin(host) do
    frontend_host =
      if String.starts_with?(host, "api.") do
        "app." <> String.trim_leading(host, "api.")
      else
        host
      end

    "https://" <> origin_host(frontend_host)
  end

  defp origin_host("[" <> _rest = host), do: host

  defp origin_host(host) do
    if String.contains?(host, ":"), do: "[#{host}]", else: host
  end

  defp normalize_host(nil), do: nil

  defp normalize_host(value) do
    value
    |> String.trim()
    |> case do
      "" ->
        nil

      trimmed ->
        if String.contains?(trimmed, "://") do
          trimmed
          |> URI.parse()
          |> Map.get(:host)
        else
          trimmed
          |> String.trim_trailing("/")
          |> String.split("/", parts: 2)
          |> hd()
          |> String.split(":", parts: 2)
          |> hd()
        end
    end
  end

  defp public_origin?(%URI{
         scheme: scheme,
         host: host,
         path: path,
         query: nil,
         fragment: nil,
         userinfo: nil
       }) do
    scheme in ["http", "https"] and is_binary(host) and host != "" and path in [nil, "/"]
  end

  defp public_origin?(_uri), do: false
end
