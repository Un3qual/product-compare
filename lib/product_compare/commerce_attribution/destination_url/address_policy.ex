defmodule ProductCompare.CommerceAttribution.DestinationUrl.AddressPolicy do
  @moduledoc false

  @documentation_ipv4_ranges MapSet.new(["192.0.2", "198.51.100", "203.0.113"])

  @spec public_hostname?(String.t()) :: boolean()
  def public_hostname?(hostname) do
    valid_hostname?(hostname) and
      not localhost_hostname?(hostname) and
      not reserved_ip_hostname?(hostname)
  end

  defp valid_hostname?(hostname) do
    if String.contains?(hostname, ":") do
      match?({:ok, address} when tuple_size(address) == 8, parse_ip_address(hostname))
    else
      hostname |> String.split(".") |> Enum.all?(&valid_hostname_label?/1)
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
    hostname = hostname |> String.trim_leading("[") |> String.trim_trailing("]")

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

  defp parse_ipv4_number_part("0x" <> hex) when hex != "",
    do: parse_ipv4_number_part(hex, 16, ~r/^[0-9a-f]+$/)

  defp parse_ipv4_number_part("0" <> octal) when octal != "",
    do: parse_ipv4_number_part(octal, 8, ~r/^[0-7]+$/)

  defp parse_ipv4_number_part(decimal),
    do: parse_ipv4_number_part(decimal, 10, ~r/^\d+$/)

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
end
