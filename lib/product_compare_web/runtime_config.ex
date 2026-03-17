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

  defp frontend_origin(host) do
    frontend_host =
      if String.starts_with?(host, "api.") do
        "app." <> String.trim_leading(host, "api.")
      else
        host
      end

    URI.to_string(%URI{scheme: "https", host: frontend_host})
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
end
