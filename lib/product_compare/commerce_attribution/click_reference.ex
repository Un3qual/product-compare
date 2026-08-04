defmodule ProductCompare.CommerceAttribution.ClickReference do
  @moduledoc false

  @outbound_parameters %{
    "awin" => "clickref",
    "cj" => "sid",
    "impact" => "subId1",
    "rakuten" => "u1"
  }

  @canonical_uuid ~r/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i
  @compact_uuid ~r/\A[0-9a-f]{32}\z/i

  @spec outbound_parameter(String.t() | nil) :: String.t() | nil
  def outbound_parameter(network) when is_binary(network),
    do: Map.get(@outbound_parameters, network)

  def outbound_parameter(_network), do: nil

  @spec encode(String.t() | nil, Ecto.UUID.t()) :: String.t() | nil
  def encode(network, click_id) when is_binary(click_id) do
    with parameter when is_binary(parameter) <- outbound_parameter(network),
         {:ok, canonical_click_id} <- Ecto.UUID.cast(click_id) do
      if parameter == "u1" do
        String.replace(canonical_click_id, "-", "")
      else
        canonical_click_id
      end
    else
      _unknown_network_or_click_id -> nil
    end
  end

  def encode(_network, _click_id), do: nil

  @spec decode(String.t() | nil, String.t() | nil) :: {:ok, Ecto.UUID.t()} | :error
  def decode(network, value) when is_binary(value) do
    case outbound_parameter(network) do
      "u1" -> decode_compact_uuid(value)
      parameter when is_binary(parameter) -> decode_canonical_uuid(value)
      nil -> :error
    end
  end

  def decode(_network, _value), do: :error

  defp decode_canonical_uuid(value) do
    if String.match?(value, @canonical_uuid) do
      Ecto.UUID.cast(value)
    else
      :error
    end
  end

  defp decode_compact_uuid(value) do
    if String.match?(value, @compact_uuid) do
      value
      |> String.replace(~r/(.{8})(.{4})(.{4})(.{4})(.{12})/, "\\1-\\2-\\3-\\4-\\5")
      |> Ecto.UUID.cast()
    else
      :error
    end
  end
end
