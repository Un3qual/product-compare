defmodule ProductCompareWeb.RuntimeConfig do
  @moduledoc false

  @dev_trusted_origins ["http://127.0.0.1:5173", "http://localhost:5173"]

  @spec endpoint_host!(String.t() | nil) :: String.t()
  def endpoint_host!(phx_host) do
    case normalize_host(phx_host) do
      host when is_binary(host) ->
        host

      _invalid ->
        raise ArgumentError,
              "PHX_HOST must be a non-empty host or absolute HTTP(S) URL with a valid host"
    end
  end

  @spec default_trusted_origins(atom(), String.t() | nil) :: [String.t()]
  def default_trusted_origins(:prod, phx_host) do
    [frontend_origin(endpoint_host!(phx_host))]
  end

  def default_trusted_origins(_env, _phx_host), do: @dev_trusted_origins

  @spec session_cookie_domain(String.t(), String.t() | nil) :: String.t() | nil
  def session_cookie_domain(_endpoint_host, nil), do: nil

  def session_cookie_domain(endpoint_host, explicit_domain)
      when is_binary(endpoint_host) and is_binary(explicit_domain) do
    endpoint_host = String.downcase(endpoint_host)
    explicit_domain = explicit_domain |> String.trim() |> String.downcase()
    domain_host = String.trim_leading(explicit_domain, ".")

    if valid_cookie_domain?(endpoint_host, domain_host) do
      explicit_domain
    else
      raise ArgumentError,
            "SESSION_COOKIE_DOMAIN must be the configured PHX_HOST or one of its parent domains"
    end
  end

  def session_cookie_domain(_endpoint_host, _explicit_domain) do
    raise ArgumentError,
          "SESSION_COOKIE_DOMAIN must be the configured PHX_HOST or one of its parent domains"
  end

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

  defp origin_host(host) do
    if String.contains?(host, ":"), do: "[#{host}]", else: host
  end

  defp normalize_host(value) when is_binary(value) do
    value = String.trim(value)
    absolute? = String.contains?(value, "://")
    uri = URI.parse(if absolute?, do: value, else: "//" <> value)

    with true <- value != "" and (absolute? or not String.contains?(value, "/")),
         true <- not absolute? or uri.scheme in ["http", "https"],
         nil <- uri.userinfo do
      normalize_parsed_host(uri.host)
    else
      _invalid -> nil
    end
  end

  defp normalize_host(_value), do: nil

  defp normalize_parsed_host(host) when is_binary(host) do
    host = String.downcase(host)

    if host != "" and not String.starts_with?(host, ".") and
         not String.ends_with?(host, ".") and not String.contains?(host, "..") do
      host
    end
  end

  defp normalize_parsed_host(_host), do: nil

  defp valid_cookie_domain?(endpoint_host, domain_host) do
    has_parent_label? =
      match?([_label, _suffix], String.split(domain_host, ".", parts: 2, trim: true))

    has_parent_label? and not Domainatrex.tld?(domain_host) and
      normalize_parsed_host(domain_host) == domain_host and
      (endpoint_host == domain_host or String.ends_with?(endpoint_host, "." <> domain_host))
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
