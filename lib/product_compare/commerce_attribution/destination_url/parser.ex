defmodule ProductCompare.CommerceAttribution.DestinationUrl.Parser do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.DestinationUrl.Punycode

  @idna_dot_separators [<<0x3002::utf8>>, <<0xFF0E::utf8>>, <<0xFF61::utf8>>]

  @spec canonical_http_hostname(String.t()) :: {:ok, String.t()} | :error
  def canonical_http_hostname(url) when is_binary(url) do
    parsed_url = parse_browser_http_url(url)

    with true <- syntactic_destination_url?(url, parsed_url),
         %{host: host, userinfo: nil} <- parsed_url,
         {:ok, hostname} <- canonical_hostname(host) do
      {:ok, hostname}
    else
      _invalid -> :error
    end
  end

  defp parse_browser_http_url(url) do
    url |> normalize_browser_http_url_for_parsing() |> URI.parse() |> Map.from_struct()
  end

  defp syntactic_destination_url?(url, parsed_url) do
    with false <- String.match?(url, ~r/[[:space:]\x00-\x1F\x7F]/),
         %{scheme: scheme, host: host, authority: authority} <- parsed_url,
         true <- scheme in ["http", "https"],
         true <- is_binary(host) and host != "",
         true <- is_binary(authority),
         true <- valid_http_authority?(authority) do
      true
    else
      _invalid -> false
    end
  end

  defp canonical_hostname(hostname) when is_binary(hostname) do
    if String.contains?(hostname, ":") do
      {:ok, String.downcase(hostname)}
    else
      hostname
      |> normalize_idna_hostname()
      |> String.split(".")
      |> Enum.reduce_while({:ok, []}, fn label, {:ok, labels} ->
        case canonical_hostname_label(label) do
          {:ok, label} -> {:cont, {:ok, [label | labels]}}
          :error -> {:halt, :error}
        end
      end)
      |> case do
        {:ok, labels} -> {:ok, labels |> Enum.reverse() |> Enum.join(".")}
        :error -> :error
      end
    end
  end

  defp normalize_browser_http_url_for_parsing(url), do: String.replace(url, "\\", "/")

  defp normalize_idna_hostname(hostname) do
    hostname
    |> URI.decode()
    |> String.normalize(:nfkc)
    |> replace_idna_dot_separators()
  end

  defp replace_idna_dot_separators(hostname) do
    Enum.reduce(@idna_dot_separators, hostname, fn separator, normalized ->
      String.replace(normalized, separator, ".")
    end)
  end

  defp valid_http_authority?(authority) do
    authority
    |> String.split("@")
    |> List.last()
    |> valid_authority_host_port?()
  end

  defp valid_authority_host_port?("[" <> rest) do
    case String.split(rest, "]", parts: 2) do
      [address, ""] -> address != ""
      [address, ":" <> port] -> address != "" and valid_explicit_port?(port)
      _invalid -> false
    end
  end

  defp valid_authority_host_port?(host_port) do
    case String.split(host_port, ":", parts: 2) do
      [host] -> host != ""
      [host, port] -> host != "" and valid_explicit_port?(port)
    end
  end

  defp valid_explicit_port?(""), do: true

  defp valid_explicit_port?(port) do
    with true <- String.match?(port, ~r/^\d+$/),
         {port_number, ""} <- Integer.parse(port),
         true <- port_number in 0..65_535 do
      true
    else
      _invalid -> false
    end
  end

  defp canonical_hostname_label(label) do
    label = String.downcase(label)

    if ascii_label?(label) do
      {:ok, label}
    else
      {:ok, "xn--" <> Punycode.encode(label)}
    end
  rescue
    ArgumentError -> :error
  end

  defp ascii_label?(label) do
    label |> String.to_charlist() |> Enum.all?(&(&1 < 128))
  end
end
