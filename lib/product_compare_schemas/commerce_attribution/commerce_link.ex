defmodule ProductCompareSchemas.CommerceAttribution.CommerceLink do
  use ProductCompareSchemas.Schema, :relational

  @networks [:impact, :awin, :rakuten, :cj, :amazon_associates]
  @link_types [:affiliate, :non_affiliate]
  @documentation_ipv4_ranges MapSet.new(["192.0.2", "198.51.100", "203.0.113"])
  @reserved_ipv6_prefixes ["fc", "fd", "fe8", "fe9", "fea", "feb", "ff", "2001:db8"]

  @type t :: %__MODULE__{}

  schema "commerce_links" do
    field :entropy_id, Ecto.UUID
    field :destination_url, :string
    field :link_type, Ecto.Enum, values: @link_types
    field :network, Ecto.Enum, values: @networks
    field :campaign_params, :map, default: %{}
    field :backfilled_from_affiliate_links, :boolean, default: false
    field :is_active, :boolean, default: true

    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :affiliate_program, ProductCompareSchemas.Affiliate.AffiliateProgram

    timestamps()
  end

  @spec networks() :: [atom()]
  def networks, do: @networks

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(link, attrs) do
    link
    |> cast(attrs, [
      :merchant_id,
      :affiliate_program_id,
      :destination_url,
      :link_type,
      :network,
      :campaign_params,
      :backfilled_from_affiliate_links,
      :is_active
    ])
    |> validate_required([:merchant_id, :destination_url, :link_type])
    |> validate_destination_url()
    |> validate_campaign_params()
    |> unique_constraint(:destination_url, name: :commerce_links_business_key_uq)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:affiliate_program_id)
    |> check_constraint(:link_type, name: :commerce_links_link_type_check)
    |> check_constraint(:network, name: :commerce_links_network_check)
  end

  defp validate_campaign_params(changeset) do
    case get_field(changeset, :campaign_params) do
      nil -> put_change(changeset, :campaign_params, %{})
      value when is_map(value) -> changeset
      _value -> add_error(changeset, :campaign_params, "must be a map")
    end
  end

  @spec valid_destination_url?(term()) :: boolean()
  def valid_destination_url?(url) when is_binary(url) do
    safe_destination_url?(url)
  end

  def valid_destination_url?(_url), do: false

  defp syntactic_destination_url?(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host}
      when scheme in ["http", "https"] and is_binary(host) and host != "" ->
        not String.match?(url, ~r/[[:space:]\x00-\x1F\x7F]/)

      _url ->
        false
    end
  end

  defp syntactic_destination_url?(_url), do: false

  @spec safe_destination_url?(term()) :: boolean()
  def safe_destination_url?(url) when is_binary(url) do
    with true <- syntactic_destination_url?(url),
         %URI{host: host, userinfo: nil} <- URI.parse(url),
         true <- valid_hostname?(host),
         false <- localhost_hostname?(host),
         false <- reserved_ip_hostname?(host) do
      true
    else
      _unsafe -> false
    end
  end

  def safe_destination_url?(_url), do: false

  defp validate_destination_url(changeset) do
    validate_change(changeset, :destination_url, fn :destination_url, destination_url ->
      if valid_destination_url?(destination_url) do
        []
      else
        [destination_url: "must be a valid http/https URL"]
      end
    end)
  end

  defp valid_hostname?(hostname) when is_binary(hostname) do
    if String.contains?(hostname, ":") do
      true
    else
      hostname
      |> String.split(".")
      |> Enum.all?(&valid_hostname_label?/1)
    end
  end

  defp valid_hostname?(_hostname), do: false

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
      :error -> reserved_ipv6_address?(hostname)
    end
  end

  defp parse_ipv4_address(hostname) do
    octets = String.split(hostname, ".")

    with 4 <- length(octets),
         {:ok, parsed_octets} <- parse_ipv4_octets(octets) do
      {:ok, List.to_tuple(parsed_octets)}
    else
      _invalid -> :error
    end
  end

  defp parse_ipv4_octets(octets) do
    Enum.reduce_while(octets, {:ok, []}, fn octet, {:ok, parsed_octets} ->
      case parse_ipv4_octet(octet) do
        {:ok, parsed_octet} -> {:cont, {:ok, [parsed_octet | parsed_octets]}}
        :error -> {:halt, :error}
      end
    end)
    |> case do
      {:ok, parsed_octets} -> {:ok, Enum.reverse(parsed_octets)}
      :error -> :error
    end
  end

  defp parse_ipv4_octet(octet) do
    with true <- String.match?(octet, ~r/^\d{1,3}$/),
         {parsed_octet, ""} <- Integer.parse(octet),
         true <- parsed_octet <= 255 do
      {:ok, parsed_octet}
    else
      _invalid -> :error
    end
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

  defp reserved_ipv6_address?(hostname) do
    with true <- String.contains?(hostname, ":"),
         address = String.trim(hostname, "[]") do
      case embedded_ipv4_address(address) do
        {:ok, ipv4_address} ->
          reserved_ipv4_address?(ipv4_address)

        :error ->
          address in ["::", "::1"] or
            Enum.any?(@reserved_ipv6_prefixes, &String.starts_with?(address, &1))
      end
    else
      _not_ipv6 -> false
    end
  end

  defp embedded_ipv4_address("::ffff:" <> suffix), do: embedded_ipv4_address_suffix(suffix)
  defp embedded_ipv4_address("::" <> suffix), do: embedded_ipv4_address_suffix(suffix)
  defp embedded_ipv4_address(_address), do: :error

  defp embedded_ipv4_address_suffix(""), do: :error

  defp embedded_ipv4_address_suffix(suffix) do
    case parse_ipv4_address(suffix) do
      {:ok, ipv4_address} ->
        {:ok, ipv4_address}

      :error ->
        parse_ipv4_hex_words(suffix)
    end
  end

  defp parse_ipv4_hex_words(suffix) do
    with [high_word, low_word] <- String.split(suffix, ":"),
         {:ok, high_word} <- parse_ipv6_hex_word(high_word),
         {:ok, low_word} <- parse_ipv6_hex_word(low_word) do
      {:ok, {div(high_word, 256), rem(high_word, 256), div(low_word, 256), rem(low_word, 256)}}
    else
      _invalid -> :error
    end
  end

  defp parse_ipv6_hex_word(word) do
    with true <- String.match?(word, ~r/^[0-9A-Fa-f]{1,4}$/),
         {parsed_word, ""} <- Integer.parse(word, 16),
         true <- parsed_word <= 0xFFFF do
      {:ok, parsed_word}
    else
      _invalid -> :error
    end
  end
end
