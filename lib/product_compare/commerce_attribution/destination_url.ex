defmodule ProductCompare.CommerceAttribution.DestinationUrl do
  @moduledoc """
  Validates outbound commerce destination URLs against the application's
  URL, hostname, IP-address, IDNA, and punycode policy.
  """

  @documentation_ipv4_ranges MapSet.new(["192.0.2", "198.51.100", "203.0.113"])
  @punycode_base 36
  @punycode_tmin 1
  @punycode_tmax 26
  @punycode_skew 38
  @punycode_damp 700
  @punycode_initial_bias 72
  @punycode_initial_n 128
  @idna_dot_separators [<<0x3002::utf8>>, <<0xFF0E::utf8>>, <<0xFF61::utf8>>]

  @spec valid?(term()) :: boolean()
  def valid?(url) when is_binary(url), do: safe_destination_url?(url)
  def valid?(_url), do: false

  defp syntactic_destination_url?(url) when is_binary(url) do
    parsed_url =
      url |> normalize_browser_http_url_for_parsing() |> URI.parse() |> Map.from_struct()

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

  defp safe_destination_url?(url) when is_binary(url) do
    parsed_url =
      url |> normalize_browser_http_url_for_parsing() |> URI.parse() |> Map.from_struct()

    with true <- syntactic_destination_url?(url),
         %{host: host, userinfo: nil} <- parsed_url,
         {:ok, host} <- canonical_hostname(host),
         true <- valid_hostname?(host),
         false <- localhost_hostname?(host),
         false <- reserved_ip_hostname?(host) do
      true
    else
      _unsafe -> false
    end
  end

  defp canonical_hostname(hostname) when is_binary(hostname) do
    if String.contains?(hostname, ":") do
      {:ok, String.downcase(hostname)}
    else
      hostname = normalize_idna_hostname(hostname)

      hostname
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

  defp normalize_browser_http_url_for_parsing(url) do
    String.replace(url, "\\", "/")
  end

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

  defp valid_http_authority?(authority) when is_binary(authority) do
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
      {:ok, "xn--" <> punycode_encode(label)}
    end
  rescue
    ArgumentError -> :error
  end

  defp ascii_label?(label) do
    label
    |> String.to_charlist()
    |> Enum.all?(&(&1 < 128))
  end

  defp valid_hostname?(hostname) when is_binary(hostname) do
    if String.contains?(hostname, ":") do
      match?({:ok, address} when tuple_size(address) == 8, parse_ip_address(hostname))
    else
      hostname
      |> String.split(".")
      |> Enum.all?(&valid_hostname_label?/1)
    end
  end

  defp valid_hostname_label?(label) do
    String.length(label) in 1..63 and
      not String.starts_with?(label, "-") and
      not String.ends_with?(label, "-") and
      String.match?(label, ~r/^[A-Za-z0-9-]+$/)
  end

  defp localhost_hostname?(hostname) do
    hostname = String.downcase(hostname)

    hostname == "localhost" or String.ends_with?(hostname, ".localhost")
  end

  defp reserved_ip_hostname?(hostname) do
    hostname = String.downcase(hostname)

    case parse_ipv4_address(hostname) do
      {:ok, address} -> reserved_ipv4_address?(address)
      :error -> parsed_reserved_ip_address?(hostname)
    end
  end

  defp parse_ip_address(hostname) do
    hostname =
      hostname
      |> String.trim_leading("[")
      |> String.trim_trailing("]")

    case :inet.parse_address(String.to_charlist(hostname)) do
      {:ok, address} -> {:ok, address}
      {:error, _reason} -> :error
    end
  end

  defp parsed_reserved_ip_address?(hostname) do
    case parse_ip_address(hostname) do
      {:ok, address} -> reserved_ip_address?(address)
      :error -> false
    end
  end

  defp parse_ipv4_address(hostname) do
    parts = String.split(hostname, ".")

    with part_count when part_count in 1..4 <- length(parts),
         {:ok, parsed_parts} <- parse_ipv4_number_parts(parts),
         true <- valid_ipv4_number_parts?(parsed_parts) do
      {:ok, ipv4_number_parts_to_address(parsed_parts)}
    else
      _invalid -> :error
    end
  end

  defp parse_ipv4_number_parts(parts) do
    Enum.reduce_while(parts, {:ok, []}, fn part, {:ok, parsed_parts} ->
      case parse_ipv4_number_part(part) do
        {:ok, parsed_part} -> {:cont, {:ok, [parsed_part | parsed_parts]}}
        :error -> {:halt, :error}
      end
    end)
    |> case do
      {:ok, parsed_parts} -> {:ok, Enum.reverse(parsed_parts)}
      :error -> :error
    end
  end

  defp parse_ipv4_number_part(""), do: :error

  defp parse_ipv4_number_part("0x" <> hex) when hex != "" do
    parse_ipv4_number_part(hex, 16, ~r/^[0-9a-f]+$/)
  end

  defp parse_ipv4_number_part("0" <> octal) when octal != "" do
    parse_ipv4_number_part(octal, 8, ~r/^[0-7]+$/)
  end

  defp parse_ipv4_number_part(decimal) do
    parse_ipv4_number_part(decimal, 10, ~r/^\d+$/)
  end

  defp parse_ipv4_number_part(part, base, pattern) do
    with true <- String.match?(part, pattern),
         {parsed_part, ""} <- Integer.parse(part, base) do
      {:ok, parsed_part}
    else
      _invalid -> :error
    end
  end

  defp valid_ipv4_number_parts?(parts) do
    part_count = length(parts)
    {leading_parts, [last_part]} = Enum.split(parts, part_count - 1)

    Enum.all?(leading_parts, &(&1 <= 255)) and
      last_part < Integer.pow(256, 5 - part_count)
  end

  defp ipv4_number_parts_to_address(parts) do
    part_count = length(parts)
    {leading_parts, [last_part]} = Enum.split(parts, part_count - 1)

    {address, _next_exponent} =
      Enum.reduce(leading_parts, {last_part, 3}, fn part, {address, exponent} ->
        {address + part * Integer.pow(256, exponent), exponent - 1}
      end)

    {
      div(address, 16_777_216),
      rem(div(address, 65_536), 256),
      rem(div(address, 256), 256),
      rem(address, 256)
    }
  end

  defp reserved_ipv4_address?({first, second, third, _fourth}) do
    first in [0, 127] or first >= 224 or
      first == 10 or
      (first == 172 and second in 16..31) or
      (first == 192 and second == 168) or
      (first == 100 and second in 64..127) or
      (first == 169 and second == 254) or
      MapSet.member?(@documentation_ipv4_ranges, "#{first}.#{second}.#{third}") or
      (first == 198 and second in [18, 19])
  end

  defp reserved_ip_address?({_, _, _, _} = address), do: reserved_ipv4_address?(address)

  defp reserved_ip_address?({0, 0, 0, 0, 0, 0, high_word, low_word}),
    do: high_word_low_word_to_ipv4(high_word, low_word) |> reserved_ipv4_address?()

  defp reserved_ip_address?({0, 0, 0, 0, 0, 0xFFFF, high_word, low_word}),
    do: high_word_low_word_to_ipv4(high_word, low_word) |> reserved_ipv4_address?()

  defp reserved_ip_address?({first, second, _, _, _, _, _, _}) do
    first in 0xFC00..0xFDFF or
      first in 0xFE80..0xFEBF or
      first in 0xFF00..0xFFFF or
      (first == 0x2001 and second == 0x0DB8)
  end

  defp high_word_low_word_to_ipv4(high_word, low_word) do
    {div(high_word, 256), rem(high_word, 256), div(low_word, 256), rem(low_word, 256)}
  end

  # RFC 3492 ASCII encoding for Unicode host labels before existing label validation.
  # This is not a full UTS #46/IDNA mapping layer.
  defp punycode_encode(label) do
    codepoints = String.to_charlist(label)
    basic_codepoints = Enum.filter(codepoints, &(&1 < 128))
    encoded = Enum.map_join(basic_codepoints, &<<&1::utf8>>)
    basic_count = length(basic_codepoints)

    encoded =
      if basic_count > 0 do
        encoded <> "-"
      else
        encoded
      end

    encode_punycode_codepoints(
      codepoints,
      length(codepoints),
      basic_count,
      @punycode_initial_n,
      0,
      @punycode_initial_bias,
      encoded
    )
  end

  defp encode_punycode_codepoints(
         codepoints,
         input_length,
         handled_count,
         n,
         delta,
         bias,
         encoded
       )
       when handled_count < input_length do
    m = codepoints |> Enum.filter(&(&1 >= n)) |> Enum.min()
    delta = delta + (m - n) * (handled_count + 1)

    {handled_count, delta, bias, encoded} =
      Enum.reduce(codepoints, {handled_count, delta, bias, encoded}, fn codepoint,
                                                                        {handled_count, delta,
                                                                         bias, encoded} ->
        cond do
          codepoint < m ->
            {handled_count, delta + 1, bias, encoded}

          codepoint == m ->
            encoded = encode_punycode_delta(delta, bias, encoded)

            bias =
              adapt_punycode_bias(
                delta,
                handled_count + 1,
                handled_count == basic_count(codepoints)
              )

            {handled_count + 1, 0, bias, encoded}

          true ->
            {handled_count, delta, bias, encoded}
        end
      end)

    encode_punycode_codepoints(
      codepoints,
      input_length,
      handled_count,
      m + 1,
      delta + 1,
      bias,
      encoded
    )
  end

  defp encode_punycode_codepoints(
         _codepoints,
         _input_length,
         _handled_count,
         _n,
         _delta,
         _bias,
         encoded
       ),
       do: encoded

  defp basic_count(codepoints), do: Enum.count(codepoints, &(&1 < 128))

  defp encode_punycode_delta(delta, bias, encoded),
    do: encode_punycode_delta(delta, @punycode_base, bias, encoded)

  defp encode_punycode_delta(q, k, bias, encoded) do
    t = punycode_threshold(k, bias)

    if q < t do
      encoded <> punycode_digit(q)
    else
      digit = t + rem(q - t, @punycode_base - t)
      q = div(q - t, @punycode_base - t)

      encode_punycode_delta(q, k + @punycode_base, bias, encoded <> punycode_digit(digit))
    end
  end

  defp punycode_threshold(k, bias) when k <= bias + @punycode_tmin, do: @punycode_tmin
  defp punycode_threshold(k, bias) when k >= bias + @punycode_tmax, do: @punycode_tmax
  defp punycode_threshold(k, bias), do: k - bias

  defp punycode_digit(value) when value in 0..25, do: <<?a + value>>
  defp punycode_digit(value), do: <<?0 + value - 26>>

  defp adapt_punycode_bias(delta, numpoints, first_time?) do
    delta =
      if first_time? do
        div(delta, @punycode_damp)
      else
        div(delta, 2)
      end

    delta = delta + div(delta, numpoints)

    {k, delta} = reduce_punycode_bias_delta(delta, 0)
    k + div((@punycode_base - @punycode_tmin + 1) * delta, delta + @punycode_skew)
  end

  defp reduce_punycode_bias_delta(delta, k)
       when delta > div((@punycode_base - @punycode_tmin) * @punycode_tmax, 2) do
    reduce_punycode_bias_delta(div(delta, @punycode_base - @punycode_tmin), k + @punycode_base)
  end

  defp reduce_punycode_bias_delta(delta, k), do: {k, delta}
end
