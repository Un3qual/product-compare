defmodule ProductCompare.CommerceAttribution.DestinationUrl do
  @moduledoc """
  Validates outbound commerce destination URLs against the application's
  URL, hostname, IP-address, IDNA, and punycode policy.
  """

  alias ProductCompare.CommerceAttribution.DestinationUrl.AddressPolicy
  alias ProductCompare.CommerceAttribution.DestinationUrl.Parser

  @spec valid?(term()) :: boolean()
  def valid?(url) when is_binary(url) do
    with {:ok, hostname} <- Parser.canonical_http_hostname(url) do
      AddressPolicy.public_hostname?(hostname)
    else
      _unsafe -> false
    end
  end

  def valid?(_url), do: false
end
